import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const PLACEHOLDER_COLOR = "#a8a8a8";

// 등록/수정 폼 한 줄: 왼쪽 라벨 + 오른쪽 입력 영역
// 드롭다운 목록 스크롤이 막히지 않도록 래퍼 View에는 zIndex/배경을 두지 않는다.
const FormField = ({ label, required, children }) => (
  <View style={styles.field}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.star}> *</Text>}
    </Text>
    <View style={styles.body}>{children}</View>
  </View>
);

export default FormField;

// 드롭다운에서 선택된 항목 오른쪽 표시: 홈 필터 체크박스와 같은 파란 체크
const CheckedTick = () => (
  <View style={styles.tick}>
    <Text style={styles.tickText}>✓</Text>
  </View>
);

// 드롭다운 선택 표시(배지·선택 항목)를 홈 필터의 선택 태그/체크박스와 맞추는 공용 props
export const dropdownSelectedProps = {
  showBadgeDot: false,
  badgeColors: "#E8EFF7",
  badgeStyle: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  badgeTextStyle: { color: "#2165A6", fontSize: 13 },
  selectedItemLabelStyle: { color: "#2165A6", fontWeight: "600" },
  TickIconComponent: CheckedTick,
};

// 폼 입력 요소 공용 스타일
export const formStyles = StyleSheet.create({
  input: {
    height: 48,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    paddingHorizontal: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: "auto",
    minHeight: 120,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  subInput: {
    marginTop: 8,
  },
  dropdown: {
    minHeight: 48,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  dropdownList: {
    maxHeight: 220,
    borderColor: "#d9d9d9",
  },
  dropdownPlaceholder: {
    color: PLACEHOLDER_COLOR,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
});

const styles = StyleSheet.create({
  tick: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#2165A6",
    alignItems: "center",
    justifyContent: "center",
  },
  tickText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  field: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  label: {
    width: 88,
    paddingTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  star: {
    color: "#fe2828",
  },
  body: {
    flex: 1,
  },
});
