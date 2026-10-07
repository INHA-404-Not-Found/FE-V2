import { useNavigation } from "@react-navigation/native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ScrollView,
  TextInput,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import mime from "react-native-mime-types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import api from "../api/api";
import DefaultHeader from "../components/DefaultHeader";
import FormBottomBar from "../components/FormBottomBar";
import FormField, {
  formStyles,
  PLACEHOLDER_COLOR,
} from "../components/FormField";
import { TokenStore } from "../TokenStore";
import PhotoPickerField from "../components/PhotoPickerField";

const AddLostPostScreen = () => {
  const navigation = useNavigation();
  const myInfo = useSelector((state) => state.my.info);
  // DropDownPicker 상태 관리
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const categoryList = useSelector((state) => state.category.categories);
  const [items, setItems] = useState(
    categoryList.map((c) => ({
      label: c.name,
      value: c.id,
    }))
  );
  const [locationOpen, setLocationOpen] = useState(false);
  const locationList = useSelector((state) => state.location.locations);
  const [locationItems, setLocationItems] = useState(
    locationList.map((l) => ({
      label: l.name,
      value: l.id,
    }))
  );
  const [locationId, setLocationId] = useState(null);
  const [locationDetail, setLocationDetail] = useState("");

  const [title, setTitle] = useState("");
  const [storedLocation, setStoredLocation] = useState("");
  const [content, setContent] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);
  const togglePersonalSwitch = () => setIsPersonal((prev) => !prev);

  const [isSN, setIsSN] = useState(false);
  const [studentId, setStudentId] = useState("");
  const toggleSwitch = () => {
    setIsSN((prev) => !prev);
    if (!isSN) {
      studentId = "";
    }
  };

  const [file, setFile] = useState([]); // [{ uri, fileName, mimeType }] 형태로 보관
  // mimeType 추정
  const guessMime = (uri) => {
    const ext = uri.split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "heic") return "image/heic";
    return "image/jpeg";
  };

  const pickImages = async () => {
    // 갤러리 접근 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("사진 접근 권한이 필요합니다");
      return;
    }

    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true, // 여러장 선택 가능
      allowsEditing: false,
      quality: 1,
    });
    console.log(result);

    if (!result.canceled) {
      let selected = result.assets;

      // 2장까지만 허용
      if (selected.length > 2) {
        alert("최대 2장까지만 선택할 수 있습니다.");
        selected = selected.slice(0, 2);
      }

      const next = selected.map((a, idx) => {
        const fileName =
          a.fileName ??
          `photo_${Date.now()}_${idx}.${a.uri.split(".").pop() || "jpg"}`;
        const mimeType = a.mimeType ?? guessMime(a.uri);
        return { uri: a.uri, fileName, mimeType };
      });

      setFile(next);
    }
  };

  // 폼 데이터 업로드
  const [postId, setPostId] = useState(null);
  const uploadPost = async () => {
    const res = await api.post(`/posts`, {
      locationId,
      locationDetail,
      title,
      content,
      status: "UNCOMPLETED",
      type: "LOST",
      categories,
    });
    const newPostId = res.data; // BE는 CommonResponse<Long>으로 id만 내려준다
    setPostId(newPostId); // state도 갱신
    return newPostId; // 호출자에게 즉시 id를 반환
  };

  const registerPostImage = async (targetPostId, files) => {
    console.log("targetPostId:", targetPostId);

    try {
      const formData = new FormData();

      // 백엔드 @RequestParam("files") → key 이름 반드시 "files"
      for (const img of files) {
        const compressedUri = await compressImage(img.uri);

        formData.append("files", {
          uri: compressedUri,
          name: img.fileName || "photo.jpg",
          type: img.mimeType || mime.getType(img.uri) || "image/jpeg",
        });
      }

      const tok = TokenStore.getToken();
      console.log("token:", tok);

      const res = await api.post(`/posts/${targetPostId}/images`, formData, {
        headers: {
          Authorization: `Bearer ${tok}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 20000, // (선택) 업로드 시간이 길면 timeout 추가
      });

      console.log("HTTP status:", res.status);
      console.log("서버 응답:", res.data);
    } catch (err) {
      console.log("에러:", err);
    }
  };

  // 이미지 압축 함수 (이미 있는 함수 그대로 재사용 가능)
  const compressImage = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return result.uri;
    } catch (error) {
      console.log("이미지 압축 중 오류:", error);
      return uri;
    }
  };

  const handleUpload = async () => {
    try {
      const id = await uploadPost(); // 대기해서 postId 확보
      console.log("post업로드성공");

      console.log(file, file.length);

      if (file.length > 0 && file) {
        await registerPostImage(id, file); // id를 명시적으로 전달
      }
      console.log("사진 업로드 전체 완료");

      // 네비게이션 이동
      console.log("postId" + id);
      navigation.navigate("PostScreen", id);
    } catch (e) {
      console.error("업로드 실패:", e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edge={["top"]}>
      <DefaultHeader />
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={formStyles.content}>
          <FormField label="제목" required>
            <TextInput
              value={title}
              onChangeText={(text) => setTitle(text)}
              placeholder="예) 검은색 반지갑"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={formStyles.input}
            />
          </FormField>
          <FormField label="카테고리" required>
            <DropDownPicker
              listMode="SCROLLVIEW"
              scrollViewProps={{ nestedScrollEnabled: true }}
              dropDownContainerStyle={formStyles.dropdownList}
              open={open}
              value={categories}
              items={items}
              setItems={setItems}
              setOpen={setOpen}
              setValue={setCategories}
              multiple={true}
              min={0}
              max={5}
              placeholder="카테고리를 선택하세요"
              placeholderStyle={formStyles.dropdownPlaceholder}
              mode="BADGE"
              style={formStyles.dropdown}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </FormField>
          <FormField label="분실 장소">
            <DropDownPicker
              listMode="SCROLLVIEW"
              scrollViewProps={{ nestedScrollEnabled: true }}
              dropDownContainerStyle={formStyles.dropdownList}
              open={locationOpen}
              value={locationId}
              items={locationItems}
              setItems={setLocationItems}
              setOpen={setLocationOpen}
              setValue={setLocationId}
              multiple={false}
              placeholder="장소를 선택하세요"
              placeholderStyle={formStyles.dropdownPlaceholder}
              mode="BADGE"
              style={formStyles.dropdown}
              zIndex={2000}
              zIndexInverse={900}
            />
            <TextInput
              placeholder="(선택) 세부 장소 예) 3층 복도"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={[formStyles.input, formStyles.subInput]}
              value={locationDetail}
              onChangeText={(text) => setLocationDetail(text)}
            />
          </FormField>
          <FormField label="내용">
            <TextInput
              value={content}
              numberOfLines={5}
              multiline={true}
              onChangeText={(text) => setContent(text)}
              placeholder="물품의 특징이나 분실 상황을 적어 주세요"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={[formStyles.input, formStyles.textArea]}
            />
          </FormField>
          <FormField label="사진">
            <PhotoPickerField
              images={file}
              max={2}
              onPress={pickImages}
              onRemove={(uri) =>
                setFile((prev) => prev.filter((f) => f.uri !== uri))
              }
            />
          </FormField>
        </View>
      </ScrollView>
      <FormBottomBar
        onCancel={() => navigation.goBack()}
        onSubmit={handleUpload}
        submitLabel="등록하기"
      />
    </SafeAreaView>
  );
};

export default AddLostPostScreen;
