import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const TILE_SIZE = 72;

// 사진 추가 타일 + 선택한 사진 미리보기를 한 줄로 보여준다.
const PhotoPickerField = ({ images, max, onPress, onRemove }) => (
  <View style={styles.row}>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        styles.addTile,
        pressed && styles.addTilePressed,
      ]}
    >
      <Image
        source={require("../assets/uploadImage2.png")}
        style={styles.addIcon}
      />
      <Text style={styles.countText}>
        {images.length}/{max}
      </Text>
    </Pressable>
    {images.map((img) => (
      <View key={img.uri}>
        <Image source={{ uri: img.uri }} style={styles.tile} />
        {onRemove && (
          <Pressable
            onPress={() => onRemove(img.uri)}
            hitSlop={8}
            style={styles.removeBtn}
          >
            <Image
              source={require("../assets/close.png")}
              style={styles.removeIcon}
            />
          </Pressable>
        )}
      </View>
    ))}
  </View>
);

export default PhotoPickerField;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 8,
  },
  addTile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  addTilePressed: {
    backgroundColor: "#f2f6ff",
  },
  addIcon: {
    width: 20,
    height: 20,
    tintColor: "#a8a8a8",
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    color: "#a8a8a8",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  removeIcon: {
    width: 10,
    height: 10,
    tintColor: "#fff",
  },
});
