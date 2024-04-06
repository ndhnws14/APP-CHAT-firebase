import { useContext, useState, useMemo, useEffect } from "react";
import { Form, Modal, Select, Spin, Avatar } from "antd";
import { AppContext } from "../context/AppProvider";
// import { debounce } from "lodash";
import { db } from "../firebase/config";
import {
	collection,
	query,
	where,
	getDocs,
	updateDoc,
	doc,
} from "firebase/firestore";

function DebounceSelect({
	fetchOptions,
	debounceTimeout = 300,
	curMembers,
	...props
}) {
	const [fetching, setFetching] = useState(false);
	const [options, setOptions] = useState([]);

	const debounce = (func, wait) => {
		let timeoutId;
		return (...args) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				func(...args);
			}, wait);
		};
	};

	const debounceFetcher = useMemo(() => {
		const loadOptions = (value) => {
			setOptions([]);
			setFetching(true);

			fetchOptions(value, curMembers).then((newOptions) => {
				setOptions(newOptions);
				setFetching(false);
			});
		};

		return debounce(loadOptions, debounceTimeout);
	}, [debounceTimeout, fetchOptions, curMembers]);

	useEffect(() => {
		return () => {
			setOptions([]);
		};
	}, []);

	return (
		<Select
			labelInValue
			filterOption={false}
			onSearch={debounceFetcher}
			notFoundContent={fetching ? <Spin size='small' /> : null}
			{...props}>
			{options.map((opt) => (
				<Select.Option key={opt.value} value={opt.value} title={opt.label}>
					<Avatar size='small' src={opt.photoURL}>
						{opt.photoURL ? "" : opt.label?.charAt(0)?.toUpperCase()}
					</Avatar>
					{` ${opt.label}`}
				</Select.Option>
			))}
		</Select>
	);
}
// **********************************************************
const fetchUserList = async (search, curMembers) => {
	try {
		let q = collection(db, "users");
		if (search) {
			q = query(
				collection(db, "users"),
				where("keywords", "array-contains", search.toLowerCase()),
			);
		}

		const snapshot = await getDocs(q);
		const userList = snapshot.docs
			.map((doc) => ({
				label: doc.data().displayName,
				value: doc.data().uid,
				photoURL: doc.data().photoURL,
			}))
			.filter((opt) => !curMembers.includes(opt.value));

		return userList;
	} catch (error) {
		console.error("Error fetching user list:", error);
		return [];
	}
};
// **********************************************************
export default function InviteMemberModal() {
	const {
		isInviteMemberVisible,
		setIsInviteMemberVisible,
		isSelectedRoomId,
		selectedRoom,
	} = useContext(AppContext);
	const [value, setValue] = useState([]);
	const [form] = Form.useForm();

	const handleOk = async () => {
		form.resetFields();
		setValue([]);

		const newMembers = value.map((val) => val.value);
		const updatedMembers = [...selectedRoom.members, ...newMembers];

		try {
			await updateDoc(doc(db, "rooms", isSelectedRoomId), {
				members: updatedMembers,
			});

			setIsInviteMemberVisible(false);
		} catch (error) {
			console.error("Error inviting members:", error);
		}
	};

	const handleCancel = () => {
		form.resetFields();
		setValue([]);
		setIsInviteMemberVisible(false);
	};

	return (
		<div>
			<Modal
				title='Mời thêm thành viên'
				open={isInviteMemberVisible}
				onOk={handleOk}
				onCancel={handleCancel}
				destroyOnClose={true}>
				<Form form={form} layout='vertical'>
					<DebounceSelect
						mode='multiple'
						name='search-user'
						label='Tên các thành viên'
						value={value}
						placeholder='Nhập tên thành viên'
						fetchOptions={fetchUserList}
						onChange={(newValue) => setValue(newValue)}
						style={{ width: "100%" }}
						curMembers={selectedRoom?.members}
					/>
				</Form>
			</Modal>
		</div>
	);
}