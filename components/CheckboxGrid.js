import { Checkbox } from "expo-checkbox";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 홈 필터(물품 카테고리, 완료 여부)에서 같은 모양으로 쓰는 2열 단일 선택 체크박스 목록
const CheckboxGrid = ({ items, selectedId, onToggle }) => {
  return (
    <View style={styles.listContainer}>
      <View style={styles.section}>
        {items.map((item) => {
          const checked = item.id === selectedId;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onToggle(item)}
              style={styles.checkboxContainer}
            >
              <Checkbox
                value={checked}
                color={checked ? "#2165A6" : "#c4c4c4"}
                style={styles.checkbox}
                onValueChange={() => onToggle(item)}
              />
              <Text style={styles.label}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default CheckboxGrid;

const styles = StyleSheet.create({
  // 고정 높이 + column wrap이면 항목이 많을 때 아래 태그/버튼 위로 넘쳐서, 높이 없이 2열 그리드로 둔다
  listContainer: {
    paddingVertical: 20,
  },
  section: {
    paddingHorizontal: 23,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  checkboxContainer: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
  },
});
