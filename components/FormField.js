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
