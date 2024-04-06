import { Form, Modal, Input } from "antd";
import { useContext } from "react";
import { AppContext } from "../context/AppProvider";
import { addDocument } from "../firebase/service";
import { AuthContext } from "../context/AuthContext";

export default function AddRoomModal() {
	const { isAddRoomVisible, setIsAddRoomVisible } = useContext(AppContext);
	const currentUser = useContext(AuthContext).currentUser;
	const uid = currentUser?.uid;
	const [form] = Form.useForm();

	const handleOk = () => {
		console.log("formData", form.getFieldsValue());
		addDocument("rooms", { ...form.getFieldsValue(), members: [uid] });
		setIsAddRoomVisible(false);
		form.resetFields();
	};
	const handleCancel = () => {
		setIsAddRoomVisible(false);
		form.resetFields();
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
					<Form.Item label='Tên phòng' name='name'>
						<Input placholder='Nhập tên phòng' />
					</Form.Item>
					<Form.Item label='Mô tả' name='description'>
						<Input.TextArea placholder='Nhập mô tả' />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
