import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// 등록/수정 화면 하단 고정 버튼: [취소] [제출(넓게)]
const FormBottomBar = ({ onCancel, onSubmit, submitLabel }) => (
  <View style={styles.bar}>
    <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel}>
      <Text style={styles.cancelText}>취소</Text>
    </Pressable>
    <Pressable style={[styles.btn, styles.submit]} onPress={onSubmit}>
      <Text style={styles.submitText}>{submitLabel}</Text>
    </Pressable>
  </View>
);

export default FormBottomBar;

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  btn: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    flex: 1,
    backgroundColor: "#f2f6ff",
  },
  submit: {
    flex: 2,
    backgroundColor: "#215294",
  },
  cancelText: {
    color: "#215294",
    fontSize: 16,
    fontWeight: "600",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
