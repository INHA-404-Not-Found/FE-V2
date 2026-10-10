import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import LocationViewBox from "./LocationViewBox";

const TABS = [
  { key: "map", label: "지도" },
  { key: "list", label: "목록" },
];

// 장소 선택: 지도 탭(지도 영역이 있는 건물만)과 목록 탭(서버의 전체 장소)을 전환하며 선택
// 지도 구역 id와 서버 장소 id가 같다는 전제로 두 탭이 선택 상태를 공유한다.
const LocationPicker = ({ selected, setSelected }) => {
  const [tab, setTab] = useState("map");
  const locations = useSelector((state) => state.location?.locations ?? []);

  const handleSelect = (l) => {
    setSelected(l.id === selected?.id ? null : { id: l.id, name: l.name });
  };

  return (
    <View>
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "map" ? (
        <LocationViewBox selected={selected} setSelected={setSelected} />
      ) : (
        <View style={styles.chipWrap}>
          {locations.map((l) => {
            const active = l.id === selected?.id;
            return (
              <Pressable
                key={l.id}
                onPress={() => handleSelect(l)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {l.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default LocationPicker;

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 14,
    color: "#a8a8a8",
  },
  tabTextActive: {
    color: "#215294",
    fontWeight: "600",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 18,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: "#215294",
    backgroundColor: "#215294",
  },
  chipText: {
    fontSize: 13,
    color: "#333",
  },
  chipTextActive: {
    color: "#fff",
  },
});
