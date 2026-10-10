import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as ImageManipulator from "expo-image-manipulator";
import DropDownPicker from "react-native-dropdown-picker";
import { useSelector } from "react-redux";
import DefaultHeader from "../components/DefaultHeader";
import FormBottomBar from "../components/FormBottomBar";
import FormField, {
  formStyles,
  PLACEHOLDER_COLOR,
} from "../components/FormField";
import LocationSelectField from "../components/LocationSelectField";
import PhotoPickerField from "../components/PhotoPickerField";
import { toImageSource, toImageUri } from "../utils/imageSource";

import { mime } from "react-native-mime-types";
import api from "../api/api";
import { getPost } from "../api/post"; // 기존 파일 사용 가정
import { TokenStore } from "../TokenStore";

const EditPostScreen = ({ route }) => {
  const navigation = useNavigation();

  const routePostId = route?.params?.postId ?? route?.params ?? null;
  const [postId, setPostId] = useState(routePostId);

  // post는 객체가 더 적절
  const [post, setPost] = useState(null);

  // form fields (초기값은 빈값; post 로드되면 채움)
  const [title, setTitle] = useState("");
  const [storedLocation, setStoredLocation] = useState("");
  const [content, setContent] = useState("");
  const [isSN, setIsSN] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [file, setFile] = useState([]); // 항상 배열로 처리

  // image preview source helper
  const imageSource = toImageSource(post?.imagePath);

  // DropDownPicker 관련 상태
  const [open, setOpen] = useState(false);
  const categoryList = useSelector((state) => state.category?.categories ?? []);
  const [items, setItems] = useState(
    categoryList.map((c) => ({
      label: c.name,
      value: c.id,
    })),
  );
  const [categories, setCategories] = useState([]); // 선택된 카테고리 값들 String List

  const [locationOpen, setLocationOpen] = useState(false);
  const locationList = useSelector((state) => state.location?.locations ?? []);
  const [locationItems, setLocationItems] = useState(
    locationList.map((l) => ({
      label: l.name,
      value: l.id,
    })),
  );
  const [locationId, setLocationId] = useState(null);
  const [locationDetail, setLocationDetail] = useState("");

  // 카테고리/장소 items는 redux 값이 바뀔 때 세팅
  useEffect(() => {
    if (Array.isArray(categoryList)) {
      setItems(
        categoryList.map((c) => ({
          label: c.name,
          value: c.id,
        })),
      );
    }
  }, [categoryList]);

  useEffect(() => {
    if (Array.isArray(locationList)) {
      setLocationItems(
        locationList.map((l) => ({
          label: l.name,
          value: l.id,
        })),
      );
    }
  }, [locationList]);

  // postId가 있으면 post 불러오기
  useEffect(() => {
    if (!postId) return;
    console.log("postId: " + postId);
    getPost(setPost, postId);
  }, [postId]);

  // post가 로드되면 각 form 상태 동기화
  useEffect(() => {
    if (!post) return;
    setTitle(post.title ?? "");
    setStoredLocation(post.storedLocation ?? "");
    setContent(post.content ?? "");
    setIsSN(Boolean(post.isPersonal));
    setStudentId(post.studentId ?? "");
    // imagePath가 문자열이면 배열로, 이미 배열이면 그대로 사용
    if (!post.imagePath) {
      setFile([]);
    } else if (Array.isArray(post.imagePath)) {
      setFile(
        post.imagePath.map((p, idx) =>
          typeof p === "string"
            ? { uri: p, fileName: `image_${idx}.jpg`, mimeType: "image/jpeg" }
            : p,
        ),
      );
    } else if (typeof post.imagePath === "string") {
      setFile([
        {
          uri: post.imagePath,
          fileName: "image_0.jpg",
          mimeType: "image/jpeg",
        },
      ]);
    } else {
      setFile([]);
    }
    // 카테고리, location 관련 초기값이 있다면 설정
    if (Array.isArray(post?.categories)) {
      setCategories(
        categoryList
          .filter((c) => post.categories.includes(c.name))
          .map((c) => c.id),
      );
    }
    if (post.locationName) {
      const match = locationList.find((l) => l.name === post.locationName);
      if (match) setLocationId(match.id);
      else setLocationId(null); // 없으면 초기화
    }
    if (post.locationDetail) setLocationDetail(post.locationDetail);
  }, [post]);

  // mimeType 추정 (간단)
  const guessMime = (uri) => {
    const ext = uri.split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "heic") return "image/heic";
    return "image/jpeg";
  };

  // 이미지를 upload를 해야하는지 false => 이미지 변경 안 함. true => 이미지 변경함
  const [changeImage, setChangeImage] = useState(false);

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
      setChangeImage(true);
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

  const toggleSwitch = () => {
    setIsSN((prev) => {
      const next = !prev;
      if (!next) {
        // 비활성화하면 학번 비움
        setStudentId("");
      }
      return next;
    });
  };

  // 업로드 함수들: 실제 API에 맞춰 구현 필요
  const uploadPost = async () => {
    try {
      const res = await api.patch(`/posts/${postId}`, {
        locationId,
        locationDetail,
        title,
        content,
        storedLocation,
        state: post.status,
        type: post.type,
        isPersonal: post.isPersonal,
        categories,
      });
      console.log("게시글 수정 성공:", res.data);
    } catch (e) {
      console.error("에러 발생: ", e);
      alert("게시글 수정 실패");
    }
    // 예시 플레이스홀더: 서버에 post 수정/생성 요청 후 id 반환
    // 실제로는 PUT /posts/:id 또는 POST /posts 등으로 구현되어 있을 것
    // 아래는 단순 플레이스홀더
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(postId ?? 12345); // 실제로는 응답에서 postId 받아옴
      }, 300);
    });
  };

  const uploadImage = async (targetPostId, files) => {
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

      const res = await api.patch(`/posts/${targetPostId}/images`, formData, {
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
        compress: 0.1,
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
      await uploadPost();

      if (changeImage && file && file.length > 0) {
        console.log(file);
        await uploadImage(postId, file);
      }
      console.log("업로드 전체 완료");

      navigation.navigate("PostScreen", postId);
    } catch (e) {
      console.error("업로드 실패:", e?.response?.status ?? "", e?.message ?? e);
      alert("업로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "white" }}
      edges={["top", "bottom"]}
    >
      <DefaultHeader />
      {post ? (
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
            <FormField
              label={post.type === "FIND" ? "습득 장소" : "분실 장소"}
              required={post.type === "FIND"}
            >
              {/* 분실 글은 장소 다중 선택 도입 전까지 기존 드롭다운 유지 */}
              {post.type === "FIND" ? (
                <LocationSelectField
                  title="습득 장소"
                  locationId={locationId}
                  setLocationId={setLocationId}
                />
              ) : (
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
              )}
              <TextInput
                placeholder="(선택) 세부 장소 예) 3층 복도"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[formStyles.input, formStyles.subInput]}
                value={locationDetail}
                onChangeText={(text) => setLocationDetail(text)}
              />
            </FormField>
            {post.type === "FIND" && (
              <FormField label="보관 위치">
                <TextInput
                  value={storedLocation}
                  onChangeText={(text) => setStoredLocation(text)}
                  placeholder="예) 학생지원팀, 본인 보관"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  style={formStyles.input}
                />
              </FormField>
            )}
            <FormField label="내용">
              <TextInput
                value={content}
                numberOfLines={5}
                multiline={true}
                onChangeText={(text) => setContent(text)}
                placeholder="물품의 특징이나 상황을 적어 주세요"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[formStyles.input, formStyles.textArea]}
              />
            </FormField>
            <FormField label="사진">
              {/* 새로 고른 사진만 삭제 가능: 이미지 수정 API가 전체 교체 방식이라 기존 사진 일부만 지울 수 없음 */}
              <PhotoPickerField
                images={
                  changeImage
                    ? file
                    : [].concat(post?.imagePath ?? []).map((p) => ({
                        uri: toImageUri(p),
                      }))
                }
                max={2}
                onPress={pickImages}
                onRemove={
                  changeImage
                    ? (uri) => {
                        const next = file.filter((f) => f.uri !== uri);
                        setFile(next);
                        // 새 사진을 모두 지우면 기존 사진 유지로 되돌린다
                        if (next.length === 0) setChangeImage(false);
                      }
                    : undefined
                }
              />
            </FormField>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <FormBottomBar
        onCancel={() => navigation.goBack()}
        onSubmit={handleUpload}
        submitLabel="수정하기"
      />
    </SafeAreaView>
  );
};

export default EditPostScreen;
