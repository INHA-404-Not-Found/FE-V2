import React, { useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as SvgImage, Path, Svg } from "react-native-svg";
import { useSelector } from "react-redux";
import LocationMap from "./LocationMap";
import {
  CAMPUS_ZONES,
  MAP_IMAGE,
  ORIGINAL_HEIGHT,
  ORIGINAL_WIDTH,
  parsePolygon,
} from "../constants/campusMap";

const PREVIEW_ASPECT = 16 / 9;

// 건물이 가운데 오고 주변이 조금 보이도록 미리보기 viewBox 계산
const getPreviewViewBox = (d) => {
  const poly = parsePolygon(d);
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  let w = Math.max((maxX - minX) * 3, 420);
  let h = w / PREVIEW_ASPECT;
  if (h < (maxY - minY) * 2.5) {
    h = (maxY - minY) * 2.5;
    w = h * PREVIEW_ASPECT;
  }
  if (w > ORIGINAL_WIDTH) {
    w = ORIGINAL_WIDTH;
    h = w / PREVIEW_ASPECT;
  }

  const x = Math.min(
    ORIGINAL_WIDTH - w,
    Math.max(0, (minX + maxX) / 2 - w / 2),
  );
  const y = Math.min(
    ORIGINAL_HEIGHT - h,
    Math.max(0, (minY + maxY) / 2 - h / 2),
  );
  return `${x} ${y} ${w} ${h}`;
};

// 게시글 상세의 장소 지도 미리보기: 누르면 확대/축소 가능한 전체 화면 지도
// 상세 응답에는 장소 이름만 있어 이름 → 장소 id → 지도 구역 순으로 찾고, 구역이 없으면 그리지 않는다.
const LocationPreview = ({ locationName }) => {
  const [open, setOpen] = useState(false);
  const locations = useSelector((state) => state.location?.locations ?? []);

  const zone = useMemo(() => {
    const location = locations.find((l) => l.name === locationName);
    const z = CAMPUS_ZONES.find((c) => c.id === location?.id);
    return z?.d ? z : null;
  }, [locations, locationName]);

  if (!zone) return null;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.preview}>
        <Svg
          viewBox={getPreviewViewBox(zone.d)}
          width="100%"
          style={{ aspectRatio: PREVIEW_ASPECT }}
          pointerEvents="none"
        >
          <SvgImage
            href={MAP_IMAGE}
            x="0"
            y="0"
            width={ORIGINAL_WIDTH}
            height={ORIGINAL_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
          />
          <Path
            d={zone.d}
            fill="rgba(33,143,202,0.5)"
            stroke="#218FCA"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </Svg>
        <View style={styles.expandBadge}>
          <Text style={styles.expandText}>크게 보기</Text>
        </View>
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Android에서 Modal은 별도 창이라 제스처 처리를 위해 다시 감싼다 */}
        <GestureHandlerRootView style={styles.modal}>
          <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {zone.name}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.closeButton}
                hitSlop={10}
              >
                <Image
                  source={require("../assets/close.png")}
                  style={styles.closeImage}
                />
              </Pressable>
            </View>
            <LocationMap zone={zone} />
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};

export default LocationPreview;

const styles = StyleSheet.create({
  preview: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  expandBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  expandText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  modal: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#215294",
  },
  closeButton: {
    marginLeft: 12,
  },
  closeImage: {
    width: 24,
    height: 24,
  },
});
