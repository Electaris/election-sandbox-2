import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { DetailedStateCode } from "../data/detailedStateManifest.ts";
import {
  NIGHT_TIMELINE_CANDIDATE_IDS,
  type NightMarginTimeline,
  type NightTimelineCandidateId,
} from "../replay/visibleReplayTimeline.ts";

echarts.use([
  AriaComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const CANDIDATE_LABELS: Readonly<Record<NightTimelineCandidateId, string>> = {
  harris: "Harris",
  trump: "Trump",
  stein: "Stein",
  oliver: "Oliver",
  "other-residual": "Other/write-in",
};
const SERIES_COLORS: Readonly<Record<NightTimelineCandidateId, string>> = {
  harris: "#2f82ad",
  trump: "#c5563f",
  stein: "#4f865f",
  oliver: "#b38b2b",
  "other-residual": "#7a8587",
} as const;

interface ElectionNightMarginTimelineProps {
  timeline: NightMarginTimeline;
  focusStateCode: DetailedStateCode | null;
  onSeek: (progressMillionths: number) => void;
}

function sharePercent(partsPerMillion: number | null) {
  return partsPerMillion === null ? null : partsPerMillion / 10_000;
}

function formatShare(value: number) {
  return `${value.toFixed(1)}%`;
}

function seriesData(
  timeline: NightMarginTimeline,
  candidateId: NightTimelineCandidateId,
  stateCode: DetailedStateCode | null,
) {
  return timeline.points.map((point) => [
    point.atMs,
    sharePercent(stateCode === null
      ? point.nationalCandidateSharePartsPerMillion[candidateId]
      : point.jurisdictionCandidateSharePartsPerMillion[stateCode][candidateId]),
    point.eventId,
    point.returningJurisdictionId,
    point.ballotsPublished,
  ]);
}

export default function ElectionNightMarginTimeline({
  timeline,
  focusStateCode,
  onSeek,
}: ElectionNightMarginTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const onSeekRef = useRef(onSeek);

  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = echarts.init(container, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const handleClick = (event: { offsetX: number; offsetY: number }) => {
      const converted = chart.convertFromPixel(
        { gridIndex: 0 },
        [event.offsetX, event.offsetY],
      ) as number[];
      const atMs = converted?.[0];
      if (!Number.isFinite(atMs)) return;
      const duration = timeline.endsAtMs - timeline.startsAtMs;
      const progress = duration <= 0
        ? 1_000_000
        : Math.round((atMs - timeline.startsAtMs) * 1_000_000 / duration);
      onSeekRef.current(Math.max(0, Math.min(1_000_000, progress)));
    };
    chart.getZr().on("click", handleClick);
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      chart.getZr().off("click", handleClick);
      chart.dispose();
      chartRef.current = null;
    };
  }, [timeline.endsAtMs, timeline.startsAtMs]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const series = NIGHT_TIMELINE_CANDIDATE_IDS.map((candidateId) => {
      const isMinorCandidate = candidateId === "oliver" || candidateId === "other-residual";
      return {
        name: CANDIDATE_LABELS[candidateId],
        type: "line",
        data: seriesData(timeline, candidateId, focusStateCode),
        showSymbol: false,
        connectNulls: false,
        sampling: "lttb",
        animation: false,
        silent: false,
        lineStyle: {
          width: isMinorCandidate ? 1.25 : 2.15,
          color: SERIES_COLORS[candidateId],
          opacity: isMinorCandidate ? 0.7 : 0.95,
        },
        itemStyle: { color: SERIES_COLORS[candidateId] },
        emphasis: { focus: "series" },
        markLine: candidateId === "harris" ? {
          silent: true,
          symbol: ["none", "none"],
          label: { show: false },
          lineStyle: { color: "rgba(185, 143, 43, 0.68)", width: 1 },
          data: [{ xAxis: timeline.currentTimeMs }],
        } : undefined,
      };
    });
    chart.setOption({
      animation: false,
      aria: {
        enabled: true,
        description: `Reported five-candidate vote shares over logical election-night time for ${focusStateCode ?? "the three-state count"}.`,
      },
      color: Object.values(SERIES_COLORS),
      legend: {
        top: 0,
        right: 4,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 3,
        textStyle: { color: "#61767f", fontFamily: "DM Mono", fontSize: 8 },
      },
      tooltip: {
        trigger: "axis",
        renderMode: "richText",
        confine: true,
        axisPointer: { type: "line", lineStyle: { color: "#9a8245", width: 1 } },
        formatter: (raw: unknown) => {
          const params = Array.isArray(raw) ? raw as Array<{ seriesName: string; value: unknown[] }> : [];
          if (!params.length) return "No reported candidate share";
          const atMs = Number(params[0].value[0]);
          const lines = [focusStateCode ?? "Three-state total", new Date(atMs).toLocaleString("en-US", {
            timeZone: "America/New_York",
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          })];
          for (const entry of params) {
            const value = Number(entry.value[1]);
            if (Number.isFinite(value)) lines.push(`${entry.seriesName}  ${formatShare(value)}`);
          }
          return lines.join("\n");
        },
        textStyle: { color: "#254657", fontFamily: "DM Mono", fontSize: 9 },
        backgroundColor: "rgba(250, 249, 243, 0.96)",
        borderColor: "rgba(45, 79, 91, 0.18)",
      },
      grid: { top: 30, right: 18, bottom: 28, left: 46, containLabel: false },
      xAxis: {
        type: "time",
        min: timeline.startsAtMs,
        max: timeline.endsAtMs,
        splitNumber: 4,
        axisLabel: {
          color: "#7a8c92",
          fontFamily: "DM Mono",
          fontSize: 7,
          hideOverlap: true,
          formatter: (value: number) => new Date(value).toLocaleTimeString("en-US", {
            timeZone: "America/New_York",
            hour: "numeric",
            minute: "2-digit",
          }),
        },
        axisLine: { lineStyle: { color: "rgba(50, 80, 90, 0.16)" } },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        min: 0,
        axisLabel: {
          color: "#7a8c92",
          fontFamily: "DM Mono",
          fontSize: 7,
          formatter: (value: number) => `${value.toFixed(0)}%`,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgba(50, 80, 90, 0.09)" } },
      },
      series,
    }, { notMerge: true, lazyUpdate: true, silent: true });
  }, [focusStateCode, timeline]);

  return <figure
    aria-label="Reported candidate share timeline. Click to seek the count."
    data-observed-returns={timeline.observedReturnCount}
    className="night-margin-timeline-figure"
    role="img"
  ><div className="night-margin-timeline-chart" ref={containerRef} /></figure>;
}
