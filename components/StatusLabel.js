import React from "react";
import { StyleSheet, Text, View } from "react-native";

const STATUS_MAP = {
  UNCOMPLETED: { label: "미완료", color: "#EA580C" },
  COMPLETED: { label: "완료", color: "#2563EB" },
  POLICE: { label: "인계됨", color: "#A10CF2" },
};

const StatusLabel = ({ status }) => {
  const { label, color } = STATUS_MAP[status] ?? { label: status, color: "#EA580C" };
  return (
    <View style={[styles.roundBorder, { borderColor: color }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
};

export default StatusLabel;

const styles = StyleSheet.create({
  roundBorder: {
    borderWidth: 1,
    borderColor: "#EA580C",
    borderRadius: 15,
  },
  statusText: {
    color: "#EA580C",
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 12,
  },
});
