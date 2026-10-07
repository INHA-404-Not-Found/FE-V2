import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from "../utils/recentSearchStorage";

const RecentSearchList = ({ onSelect }) => {
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    getRecentSearches().then(setKeywords);
  }, []);

  const handleRemove = async (keyword) => {
    setKeywords(await removeRecentSearch(keyword));
  };

  const handleClearAll = async () => {
    await clearRecentSearches();
    setKeywords([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>최근 검색어</Text>
        {keywords.length > 0 && (
          <Pressable onPress={handleClearAll} hitSlop={8}>
            <Text style={styles.clearAllText}>전체 삭제</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={keywords}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.keywordRow,
              pressed && { backgroundColor: "#f2f6ff" },
            ]}
          >
            <Text style={styles.keywordText} numberOfLines={1}>
              {item}
            </Text>
            <Pressable onPress={() => handleRemove(item)} hitSlop={10}>
              <Image
                source={require("../assets/close.png")}
                style={styles.removeImg}
              />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>최근 검색어가 없습니다.</Text>
        }
      />
    </View>
  );
};

export default RecentSearchList;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  titleText: {
    fontSize: 15,
    fontWeight: 600,
  },
  clearAllText: {
    fontSize: 13,
    color: "#a8a8a8",
  },
  keywordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  keywordText: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  removeImg: {
    width: 14,
    height: 14,
    opacity: 0.5,
  },
  emptyText: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 13,
    color: "#a8a8a8",
  },
});
