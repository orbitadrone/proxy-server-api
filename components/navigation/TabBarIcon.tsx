
import React from 'react';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { Ionicons } from '@expo/vector-icons';

export function TabBarIcon({ style, ...rest }: IconProps<'map' | 'map-outline' | 'pin' | 'pin-outline' | 'list' | 'list-outline' | 'cloud' | 'cloud-outline'>) {
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}
