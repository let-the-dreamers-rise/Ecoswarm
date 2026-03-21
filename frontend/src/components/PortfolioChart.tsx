import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { PortfolioResponse } from '../types';

interface PortfolioChartProps {
  portfolio: PortfolioResponse | null;
  previousAllocations?: Record<string, number> | null;
}

interface ChartData {
  category: string;
  percentage: number;
  color: string;
  previousPercentage?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Solar: '#facc15',
  River_Cleanup: '#60a5fa',
  Reforestation: '#4ade80',
  Carbon_Capture: '#9ca3af'
};

const PortfolioChart: React.FC<PortfolioChartProps> = ({ portfolio, previousAllocations }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const svgRoot = d3.select(svgRef.current);
    svgRoot.selectAll('*').remove();

    if (!portfolio) {
      return;
    }

    const width = 420;
    const height = 420;
    const outerRadius = 150;
    const innerRadius = 78;

    const data: ChartData[] = Object.entries(portfolio.allocations).map(([category, percentage]) => ({
      category,
      percentage,
      color: CATEGORY_COLORS[category],
      previousPercentage: previousAllocations?.[category]
    }));

    const hasSignificantChange = data.some((item) => {
      if (item.previousPercentage === undefined) {
        return false;
      }
      return Math.abs(item.percentage - item.previousPercentage) > 5;
    });

    const svg = svgRoot
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const chart = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2 - 10})`);

    const pie = d3
      .pie<ChartData>()
      .value((d) => d.percentage)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<ChartData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const arcs = chart
      .selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#020617')
      .attr('stroke-width', 6)
      .transition()
      .duration(500)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(
          { startAngle: 0, endAngle: 0 } as d3.PieArcDatum<ChartData>,
          d
        );

        return function(t) {
          return arc(interpolate(t)) || '';
        };
      });

    arcs
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f8fafc')
      .attr('font-weight', '700')
      .attr('font-size', '14px')
      .style('opacity', 0)
      .text((d) => `${d.data.percentage.toFixed(1)}%`)
      .transition()
      .duration(500)
      .style('opacity', 1);

    chart
      .append('circle')
      .attr('r', innerRadius - 6)
      .attr('fill', '#020617');

    chart
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -8)
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('Capital Routing');

    chart
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 18)
      .attr('fill', '#f8fafc')
      .attr('font-size', '30px')
      .attr('font-weight', '700')
      .text('100%');

    const legend = svg
      .append('g')
      .attr('transform', `translate(24, ${height - 90})`);

    data.forEach((item, index) => {
      const group = legend.append('g').attr('transform', `translate(${index * 96}, 0)`);
      group.append('circle').attr('r', 5).attr('cx', 5).attr('cy', 5).attr('fill', item.color);
      group
        .append('text')
        .attr('x', 16)
        .attr('y', 10)
        .attr('fill', '#cbd5e1')
        .attr('font-size', '12px')
        .text(item.category.replace('_', ' '));
    });

    if (hasSignificantChange && previousAllocations) {
      const legendGroup = svg
        .append('g')
        .attr('class', 'rebalancing-legend')
        .attr('transform', `translate(24, ${height - 28})`);

      legendGroup
        .append('text')
        .attr('fill', '#fbbf24')
        .attr('font-weight', '700')
        .attr('font-size', '12px')
        .text('Rebalancing detected:');

      const changedLabels = data
        .filter((item) => item.previousPercentage !== undefined && Math.abs(item.percentage - item.previousPercentage) > 5)
        .map((item) => `${item.category.replace('_', ' ')} ${item.previousPercentage?.toFixed(1)}% -> ${item.percentage.toFixed(1)}%`)
        .join(' | ');

      legendGroup
        .append('text')
        .attr('x', 132)
        .attr('fill', '#e2e8f0')
        .attr('font-size', '12px')
        .text(changedLabels);
    }
  }, [portfolio, previousAllocations]);

  return (
    <div className="flex justify-center items-center">
      <svg ref={svgRef} />
    </div>
  );
};

export default PortfolioChart;
