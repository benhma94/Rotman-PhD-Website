# frozen_string_literal: true

require "date"
require "jekyll"
require_relative "../_plugins/calendar_feed_generator"

module CalendarFeedChecks
  module_function

  def assert(condition, message)
    raise message unless condition
  end

  def assert_equal(expected, actual, message)
    return if expected == actual

    raise "#{message}: expected #{expected.inspect}, got #{actual.inspect}"
  end

  def unfold(raw)
    physical_lines = raw.split(RotmanPhd::CalendarFeed::CRLF, -1)
    assert_equal("", physical_lines.pop, "feed must end with CRLF")

    physical_lines.each_with_object([]) do |line, logical_lines|
      if line.start_with?(" ", "\t")
        assert(!logical_lines.empty?, "continuation line cannot be first")
        logical_lines[-1] << line[1..]
      else
        logical_lines << line.dup
      end
    end
  end

  def event_blocks(logical_lines)
    events = []
    current = nil

    logical_lines.each do |line|
      if line == "BEGIN:VEVENT"
        assert(current.nil?, "VEVENT components cannot be nested")
        current = []
      elsif line == "END:VEVENT"
        assert(!current.nil?, "END:VEVENT must follow BEGIN:VEVENT")
        events << current
        current = nil
      elsif current
        current << line
      end
    end

    assert(current.nil?, "VEVENT must be closed")
    events
  end

  def validate_components(logical_lines)
    stack = []
    logical_lines.each do |line|
      if line.start_with?("BEGIN:")
        stack << line.delete_prefix("BEGIN:")
      elsif line.start_with?("END:")
        component = line.delete_prefix("END:")
        assert_equal(component, stack.pop, "calendar component nesting is invalid")
      end
    end
    assert(stack.empty?, "all calendar components must be closed")
  end

  def property_line(event, name)
    event.find { |line| line.start_with?("#{name}:", "#{name};") }
  end

  def run
    feed_path = ENV.fetch(
      "CALENDAR_FEED_PATH",
      File.expand_path("../_site/events.ics", __dir__)
    )
    raw = File.binread(feed_path).force_encoding(Encoding::UTF_8)

    assert(raw.valid_encoding?, "calendar feed must be valid UTF-8")
    assert(!raw.match?(/(?<!\r)\n/), "calendar feed must not contain bare LF line endings")
    assert(!raw.match?(/\r(?!\n)/), "calendar feed must not contain bare CR line endings")

    physical_lines = raw.split(RotmanPhd::CalendarFeed::CRLF, -1)
    physical_lines[0...-1].each_with_index do |line, index|
      assert(line.bytesize <= 75, "physical line #{index + 1} exceeds 75 bytes")
    end

    logical_lines = unfold(raw)
    assert_equal("BEGIN:VCALENDAR", logical_lines.first, "feed must begin with VCALENDAR")
    assert_equal("END:VCALENDAR", logical_lines.last, "feed must end with VCALENDAR")
    assert(logical_lines.include?("VERSION:2.0"), "feed must declare iCalendar 2.0")
    assert(logical_lines.include?("CALSCALE:GREGORIAN"), "feed must declare Gregorian dates")
    assert(logical_lines.include?("METHOD:PUBLISH"), "feed must use publish semantics")
    validate_components(logical_lines)

    events = event_blocks(logical_lines)
    source_count = Dir.children(File.expand_path("../_events", __dir__)).count do |name|
      File.file?(File.expand_path("../_events/#{name}", __dir__))
    end
    assert_equal(source_count, events.length, "feed must contain every source event")

    uids = events.map do |event|
      %w[UID DTSTAMP SUMMARY DTSTART DTEND].each do |property|
        assert(property_line(event, property), "VEVENT is missing #{property}")
      end

      start_line = property_line(event, "DTSTART")
      end_line = property_line(event, "DTEND")
      if (match = start_line.match(/\ADTSTART;VALUE=DATE:(\d{8})\z/))
        expected_end = Date.strptime(match[1], "%Y%m%d") + 1
        assert_equal(
          "DTEND;VALUE=DATE:#{expected_end.strftime('%Y%m%d')}",
          end_line,
          "all-day DTEND must be the following day"
        )
      end

      property_line(event, "UID").delete_prefix("UID:")
    end
    assert_equal(uids.uniq.length, uids.length, "event UIDs must be unique")

    escaped = RotmanPhd::CalendarFeed.escape_text("Résumé, agenda; C:\\Temp\r\nNext")
    assert_equal(
      "Résumé\\, agenda\\; C:\\\\Temp\\nNext",
      escaped,
      "text properties must escape punctuation, backslashes, and newlines"
    )

    long_line = "DESCRIPTION:#{'Résumé, planning; ' * 20}"
    folded = RotmanPhd::CalendarFeed.fold_line(long_line)
    assert(folded.all? { |line| line.bytesize <= 75 }, "folded UTF-8 lines must be at most 75 bytes")
    unfolded = folded.first + folded.drop(1).map { |line| line.delete_prefix(" ") }.join
    assert_equal(long_line, unfolded, "folding must preserve UTF-8 content")

    fake_event = Struct.new(:data, :relative_path).new(
      {
        "date" => Date.new(2026, 12, 31),
        "title" => "Late event, with punctuation",
        "start_time" => "23:30",
        "attachments" => [{ "file" => "/assets/example.pdf" }]
      },
      "_events/test-event.md"
    )
    fake_site = Struct.new(:config).new(
      { "url" => "https://rotmanphd.ca", "baseurl" => "" }
    )
    event_lines = RotmanPhd::CalendarFeed.event_lines(fake_event, fake_site, "20260622T120000Z")
    assert(
      event_lines.include?("DTEND;TZID=America/Toronto:20270101T003000"),
      "default timed-event duration must remain valid across midnight"
    )
    assert(
      event_lines.include?("ATTACH;VALUE=URI:https://rotmanphd.ca/assets/example.pdf"),
      "relative attachments must become absolute URIs"
    )

    puts "Calendar feed validation passed (#{events.length} events)."
  end
end

CalendarFeedChecks.run
