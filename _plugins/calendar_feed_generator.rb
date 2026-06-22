# frozen_string_literal: true

require "date"
require "uri"

module RotmanPhd
  module CalendarFeed
    CRLF = "\r\n"
    TIME_ZONE = "America/Toronto"
    TIME_PATTERN = /\A(?:[01]\d|2[0-3]):[0-5]\d\z/

    module_function

    def build(site)
      events = site.collections.fetch("events").docs.sort_by { |event| event_date(event) }
      timestamp = site.time.getutc.strftime("%Y%m%dT%H%M%SZ")
      lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Rotman PhD Association//Events//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:#{escape_text('Rotman PhD Events')}",
        "X-WR-TIMEZONE:#{TIME_ZONE}",
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
        "X-PUBLISHED-TTL:PT6H"
      ]

      lines.concat(time_zone_lines) if events.any? { |event| present?(event.data["start_time"]) }
      events.each { |event| lines.concat(event_lines(event, site, timestamp)) }
      lines << "END:VCALENDAR"

      serialize(lines)
    end

    def event_lines(event, site, timestamp)
      data = event.data
      date = event_date(event)
      title = required_text(data["title"], "title", event)
      uid_host = URI.parse(site.config.fetch("url")).host || "rotmanphd.ca"
      uid_slug = Jekyll::Utils.slugify(title)
      uid_slug = "event" if uid_slug.empty?

      lines = [
        "BEGIN:VEVENT",
        "UID:#{date.strftime('%Y%m%d')}-#{uid_slug}@#{uid_host}",
        "DTSTAMP:#{timestamp}",
        "SUMMARY:#{escape_text(title)}"
      ]

      if present?(data["start_time"])
        start_at, end_at = timed_range(date, data["start_time"], data["end_time"], event)
        lines << "DTSTART;TZID=#{TIME_ZONE}:#{format_local(start_at)}"
        lines << "DTEND;TZID=#{TIME_ZONE}:#{format_local(end_at)}"
      else
        lines << "DTSTART;VALUE=DATE:#{date.strftime('%Y%m%d')}"
        lines << "DTEND;VALUE=DATE:#{(date + 1).strftime('%Y%m%d')}"
      end

      lines << "DESCRIPTION:#{escape_text(data['description'])}" if present?(data["description"])
      lines << "LOCATION:#{escape_text(data['location'])}" if present?(data["location"])
      attachment_urls(data["attachments"], site).each do |url|
        lines << "ATTACH;VALUE=URI:#{sanitize_uri(url)}"
      end
      lines << "END:VEVENT"
      lines
    end

    def time_zone_lines
      [
        "BEGIN:VTIMEZONE",
        "TZID:#{TIME_ZONE}",
        "X-LIC-LOCATION:#{TIME_ZONE}",
        "BEGIN:DAYLIGHT",
        "DTSTART:20070311T020000",
        "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
        "TZOFFSETFROM:-0500",
        "TZOFFSETTO:-0400",
        "TZNAME:EDT",
        "END:DAYLIGHT",
        "BEGIN:STANDARD",
        "DTSTART:20071104T020000",
        "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
        "TZOFFSETFROM:-0400",
        "TZOFFSETTO:-0500",
        "TZNAME:EST",
        "END:STANDARD",
        "END:VTIMEZONE"
      ]
    end

    def timed_range(date, start_value, end_value, event)
      start_hour, start_minute = parse_clock(start_value, "start_time", event)
      start_at = DateTime.new(date.year, date.month, date.day, start_hour, start_minute)

      if present?(end_value)
        end_hour, end_minute = parse_clock(end_value, "end_time", event)
        end_at = DateTime.new(date.year, date.month, date.day, end_hour, end_minute)
        end_at += 1 if end_at <= start_at
      else
        end_at = start_at + Rational(1, 24)
      end

      [start_at, end_at]
    end

    def parse_clock(value, field, event)
      text = value.to_s
      unless TIME_PATTERN.match?(text)
        raise Jekyll::Errors::FatalException,
              "Invalid #{field} '#{text}' in #{event_identifier(event)}; expected HH:MM"
      end

      text.split(":").map(&:to_i)
    end

    def event_date(event)
      value = event.data["date"]
      case value
      when DateTime, Time
        Date.new(value.year, value.month, value.day)
      when Date
        value
      else
        Date.parse(value.to_s)
      end
    rescue Date::Error
      raise Jekyll::Errors::FatalException,
            "Invalid date '#{value}' in #{event_identifier(event)}"
    end

    def attachment_urls(attachments, site)
      return [] unless attachments.respond_to?(:filter_map)

      attachments.filter_map do |attachment|
        next unless attachment.respond_to?(:[])

        file = attachment["file"] || attachment[:file]
        next unless present?(file)

        absolute_url(file.to_s, site)
      end
    end

    def absolute_url(file, site)
      return file if file.match?(/\A[a-z][a-z0-9+.-]*:/i)

      origin = site.config.fetch("url").to_s.sub(%r{/+\z}, "")
      baseurl = site.config.fetch("baseurl", "").to_s.sub(%r{/+\z}, "")
      "#{origin}#{baseurl}/#{file.sub(%r{\A/+}, '')}"
    end

    def sanitize_uri(value)
      value.to_s.gsub(/[\r\n]/, "")
    end

    def required_text(value, field, event)
      return value.to_s if present?(value)

      raise Jekyll::Errors::FatalException, "Missing #{field} in #{event_identifier(event)}"
    end

    def event_identifier(event)
      return event.relative_path if event.respond_to?(:relative_path)

      "calendar event"
    end

    def present?(value)
      !value.nil? && !value.to_s.empty?
    end

    def format_local(value)
      value.strftime("%Y%m%dT%H%M%S")
    end

    def escape_text(value)
      text = value.to_s
      text = text.gsub("\\") { "\\\\" }
      text = text.gsub(/\r\n|\r|\n/) { "\\n" }
      text = text.gsub(";") { "\\;" }
      text.gsub(",") { "\\," }
    end

    def fold_line(line)
      chunks = []
      chunk = +""
      limit = 75

      line.to_s.encode(Encoding::UTF_8).each_char do |character|
        if chunk.bytesize + character.bytesize > limit
          chunks << chunk
          chunk = +character
          limit = 74
        else
          chunk << character
        end
      end
      chunks << chunk

      [chunks.first, *chunks.drop(1).map { |continuation| " #{continuation}" }]
    end

    def serialize(lines)
      lines.flat_map { |line| fold_line(line) }.join(CRLF) + CRLF
    end
  end

  class CalendarFeedPage < Jekyll::PageWithoutAFile
    def initialize(site, content)
      super(site, site.source, "", "events.ics")
      @content = content
      @data = {
        "layout" => nil,
        "render_with_liquid" => false,
        "sitemap" => false
      }
    end
  end

  class CalendarFeedGenerator < Jekyll::Generator
    safe true
    priority :lowest

    def generate(site)
      site.pages << CalendarFeedPage.new(site, CalendarFeed.build(site))
    end
  end
end
