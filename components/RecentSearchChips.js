import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  getRecentSearches,
  removeRecentSearch,
} from "../utils/recentSearchStorage";

// 최근 검색어 일부를 줄바꿈 칩으로 표시 (메인 화면 검색창 아래)
// 다른 화면에서 검색하고 돌아오면 갱신되도록 화면이 보일 때마다 다시 불러온다.
const RecentSearchChips = ({ onSelect, limit = 5, style }) => {
  const [keywords, setKeywords] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getRecentSearches().then(setKeywords);
    }, []),
  );

  const handleRemove = async (keyword) => {
    setKeywords(await removeRecentSearch(keyword));
  };

  const visible = keywords.slice(0, limit);
  if (visible.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>최근</Text>
      <View style={styles.chipWrap}>
        {visible.map((keyword) => (
          <Pressable
            key={keyword}
            onPress={() => onSelect(keyword)}
            style={({ pressed }) => [
              styles.chip,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {keyword}
            </Text>
            <Pressable onPress={() => handleRemove(keyword)} hitSlop={8}>
              <Image
                source={require("../assets/close.png")}
                style={styles.removeImg}
              />
            </Pressable>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default RecentSearchChips;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  label: {
    marginTop: 6,
    marginRight: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#215294",
  },
  chipWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  chipPressed: {
    backgroundColor: "#f2f6ff",
  },
  chipText: {
    flexShrink: 1,
    fontSize: 13,
    color: "#333",
  },
  removeImg: {
    width: 10,
    height: 10,
    marginLeft: 6,
    tintColor: "#a8a8a8",
  },
});
