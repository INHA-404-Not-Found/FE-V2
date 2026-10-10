import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { formStyles, PLACEHOLDER_COLOR } from "./FormField";
import LocationPicker from "./LocationPicker";

// 등록/수정 폼의 장소 입력칸: 누르면 지도/목록 선택 시트가 열리고 "선택 완료"로 확정
// 화면 상위에 BottomSheetModalProvider가 있어야 한다.
const LocationSelectField = ({ locationId, setLocationId, title }) => {
  const locations = useSelector((state) => state.location?.locations ?? []);
  const current = locations.find((l) => l.id === locationId) ?? null;

  // 시트 안에서 고른 값은 "선택 완료"를 눌러야 반영
  const [draft, setDraft] = useState(null);
  const sheetRef = useRef(null);

  const open = () => {
    Keyboard.dismiss();
    setDraft(current);
    sheetRef.current?.present();
  };

  const confirm = () => {
    setLocationId(draft?.id ?? null);
    sheetRef.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <>
      <Pressable onPress={open} style={[formStyles.input, styles.field]}>
        <Text style={[styles.value, !current && styles.placeholder]}>
          {current ? current.name : "장소를 선택하세요"}
        </Text>
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        backdropComponent={renderBackdrop}
        style={styles.sheet}
      >
        <BottomSheetView style={styles.sheetContent}>
          <SafeAreaView edges={["bottom"]}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>{title}</Text>
            </View>
            <LocationPicker selected={draft} setSelected={setDraft} />
            <View style={styles.footer}>
              <Text style={styles.selectedText} numberOfLines={1}>
                {draft ? `선택: ${draft.name}` : "장소를 선택해 주세요"}
              </Text>
              <Pressable
                onPress={confirm}
                disabled={!draft}
                style={[styles.confirmBtn, !draft && styles.confirmBtnDisabled]}
              >
                <Text style={styles.confirmText}>선택 완료</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};

export default LocationSelectField;

const styles = StyleSheet.create({
  field: {
    justifyContent: "center",
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
  placeholder: {
    color: PLACEHOLDER_COLOR,
  },
  sheet: {
    borderRadius: 25,
  },
  sheetContent: {
    padding: 20,
    paddingTop: 10,
  },
  titleRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    padding: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  selectedText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  confirmBtn: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#215294",
  },
  confirmBtnDisabled: {
    backgroundColor: "#a8a8a8",
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
