import { UploadOutlined } from "@ant-design/icons";
import { Avatar, Button, Form, Input, Modal } from "antd";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useContext, useEffect, useState } from "react";
import { v4 } from "uuid";
import avtRoomDefault from "../../public/roomDefualt.svg";
import { AppContext } from "../context/AppProvider";
import { AuthContext } from "../context/AuthContext";
import { storage } from "../firebase/config";
import { addDocument } from "../firebase/service";

export default function AddRoomModal() {
	const { isAddRoomVisible, setIsAddRoomVisible } = useContext(AppContext);
	const [avatar, setAvatar] = useState({ preview: avtRoomDefault }); // Khởi tạo state avatar
	const currentUser = useContext(AuthContext).currentUser;
	const uid = currentUser?.uid;
	const [form] = Form.useForm();

	// Xử lý hàm handleOk
	const handleOk = async () => {
		try {
			await form.validateFields();
			let { name, description } = form.getFieldsValue();
			description = description ? description : " ";
			if (avatar.preview === avtRoomDefault) {
				await addDocument("rooms", {
					name,
					description,
					avatar: "default",
					members: [uid],
				});
			} else {
				const imgRef = ref(storage, `AvatarRoom/${v4()}`);
				await uploadBytes(imgRef, avatar).then((data) => {
					getDownloadURL(data.ref).then((val) => {
						addDocument("rooms", {
							name,
							description,
							avatar: val,
							members: [uid],
						});
					});
				});
			}
			setIsAddRoomVisible(false);
			form.resetFields();
			setAvatar({ preview: avtRoomDefault });
		} catch (error) {
			console.log("error", error);
		}
	};

	// Xử lý hàm handleCancel
	const handleCancel = () => {
		setIsAddRoomVisible(false);
		form.resetFields();
		setAvatar({ preview: avtRoomDefault }); // Reset state avatar về giá trị mặc định
	};

	useEffect(() => {
		return () => {
			avatar && URL.revokeObjectURL(avatar.preview);
		};
	});

	// Xử lý hàm handlePreviewAvatarRoom
	const handlePreviewAvatarRoom = (e) => {
		const file = e.target.files[0];

		file.preview = URL.createObjectURL(file);
		setAvatar(file);
	};

	return (
		<div>
			<Modal
				title='Tạo phòng'
				open={isAddRoomVisible}
				closable={false}
				onOk={handleOk}
				onCancel={handleCancel}>
				<Form form={form} layout='vertical'>
					<Form.Item
						label='Avatar phòng'
						style={{
							textAlign: "center",
							display: "flex",
							flexDirection: "column",
						}}>
						<Avatar
							style={{ width: "100px", height: "100px" }}
							src={avatar.preview}
						/>
						<Input
							style={{ display: "none" }}
							type='file'
							accept='.png,.jpg,.jpeg,.gif'
							onChange={handlePreviewAvatarRoom}
							id='file'
						/>
						<div style={{ marginTop: "10px" }}>
							<Button
								onClick={() => document.getElementById("file").click()}
								icon={<UploadOutlined />}>
								Chọn ảnh
							</Button>
						</div>
					</Form.Item>
					<Form.Item
						label='Tên phòng'
						name='name'
						rules={[{ required: true, message: "Vui lòng nhập tên phòng." }]}>
						<Input placeholder='Nhập tên phòng' />
					</Form.Item>
					<Form.Item label='Mô tả' name='description'>
						<Input.TextArea placeholder='Nhập mô tả' />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
