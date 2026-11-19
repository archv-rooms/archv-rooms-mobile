import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;

try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch (e) {
  // Expo Go não tem o módulo nativo: o banner simplesmente não aparece
}

export default function AdBanner() {
  if (Platform.OS === 'web' || !BannerAd) return null;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', backgroundColor: 'transparent' },
});