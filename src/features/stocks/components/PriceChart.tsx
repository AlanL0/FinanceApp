import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { colors } from '../../../core/theme/colors';

interface PriceChartProps {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
  testID?: string;
}

function toPolylinePoints(points: number[], width: number, height: number): string {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  return points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export const PriceChart: React.FC<PriceChartProps> = ({
  points,
  color = colors.brand.teal,
  width = 320,
  height = 160,
  testID = 'price-chart',
}) => {
  if (points.length < 2) {
    return <View testID={`${testID}-empty`} style={[styles.empty, { height }]} />;
  }

  const linePoints = toPolylinePoints(points, width, height);

  return (
    <View testID={testID} style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={colors.ui.border}
          strokeWidth={1}
        />
        <Polyline
          testID={`${testID}-line`}
          points={linePoints}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  empty: {
    width: '100%',
  },
});
