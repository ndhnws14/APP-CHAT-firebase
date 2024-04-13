import { UploadOutlined, UserAddOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Form, Input, Spin, Tooltip } from "antd";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import moment from "moment";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { v4 } from "uuid";
import avatarDefault from "../../../public/vite.svg";
import { AppContext } from "../../context/AppProvider";
import { AuthContext } from "../../context/AuthContext";
import { db, storage } from "../../firebase/config";
import useFirestore from "../../hook/useFireStore";
import Message from "./Message";

const HeaderStyled = styled.div`
	display: flex;
	justify-content: space-between;
	height: 56px;
	padding: 0 16px;
	align-items: center;
	border-bottom: 1px solid rgb(230, 230, 230);

	.header {
		&__info_avt {
			display: flex;
			flex-direction: row;
		}
		&__avt {
			margin-right: 10px;
		}
		&__info {
			display: flex;
			flex-direction: column;
			justify-content: center;
		}

		&__title {
			margin: 0;
			font-weight: bold;
		}

		&__description {
			font-size: 12px;
		}
	}
`;

const ContentStyled = styled.div`
	height: calc(100% - 56px);
	display: flex;
	flex-direction: column;
	padding: 0 11px;
	justify-content: flex-end;
`;

const ButtonGroupStyled = styled.div`
	display: flex;
	align-items: center;
`;

const MessageListStyled = styled.div`
	max-height: 100%;
	overflow-y: auto;
`;

const WrapperStyled = styled.div`
	height: 99vh;
`;

const FormStyled = styled(Form)`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 2px 2px 2px 0;
	border: 1px solid rgb(230, 230, 230);
	border-radius: 2px;

	.ant-form-item {
		margin-bottom: 0;
		margin-right: 8px;
	}
	.form_input {
		&__message {
			flex: 1;
			border: 1px solid #999;
			border-radius: 8px;
		}
	}
`;

export default function ChatWindow() {
	const { members, selectedRoom, setIsInviteMemberVisible } =
		useContext(AppContext);

	const { currentUser } = useContext(AuthContext);

	const uid = currentUser?.uid;
	const photoURL = currentUser?.photoURL;

	const displayName = currentUser?.displayName;

	const [inputValue, setInputValue] = useState("");
	const [form] = Form.useForm();
	const messageListRef = useRef(null);
	const [isInputDefault, setIsInputDefault] = useState(true);
	const [messageImgs, setMessageImgs] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef();

	const handleSetStationUInput = () => {
		setIsInputDefault(!isInputDefault);
	};

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.keyCode === 27) {
				handleSetStationUInput();
			}
		};

		if (!isInputDefault || !isLoading) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isInputDefault, isLoading]);

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};
	const handleOnSubmit = async () => {
		try {
			setIsLoading(true); // Bắt đầu quá trình loading

			if (messageImgs.length > 0) {
				const uploadPromises = messageImgs.map((messageImg) => {
					return new Promise((resolve, reject) => {
						const storageRef = ref(storage, `MessageImages/${v4()}`);
						const uploadTask = uploadBytesResumable(storageRef, messageImg);

						uploadTask.on(
							"state_changed",
							(snapshot) => {
								// Cập nhật trạng thái upload nếu cần
							},
							(error) => {
								console.log("error", error);
								reject(error);
							},
							() => {
								getDownloadURL(uploadTask.snapshot.ref)
									.then(async (downloadURL) => {
										await addDoc(collection(db, "messages"), {
											img: downloadURL,
											uid,
											photoURL,
											roomId: selectedRoom?.id,
											displayName,
											createdAt: serverTimestamp(),
										});
										resolve();
									})
									.catch((error) => {
										console.log("error", error);
										reject(error);
									});
							},
						);
					});
				});

				await Promise.all(uploadPromises);
				setMessageImgs([]);
			} else {
				if (inputValue.trim() !== "") {
					await addDoc(collection(db, "messages"), {
						text: inputValue.trim(),
						uid,
						photoURL,
						roomId: selectedRoom?.id,
						displayName,
						createdAt: serverTimestamp(),
					});
				}
				if (inputRef?.current) {
					setTimeout(() => {
						inputRef.current.focus();
					});
				}
				form.resetFields(["message"]);
				setInputValue("");
			}
		} catch (error) {
			console.error("Error adding document: ", error);
		} finally {
			setIsLoading(false); // Kết thúc quá trình loading, dù thành công hay không
		}
	};

	const fileInputRef = useRef();
	const handleUploadChange = (event) => {
		const fileList = Array.from(event.target.files);
		setMessageImgs(fileList, ...messageImgs);
		event.target.value = null;
	};

	const condition = useMemo(
		() => ({
			fieldName: "roomId",
			operator: "==",
			compareValues: selectedRoom?.id,
		}),
		[selectedRoom?.id],
	);

	const messages = useFirestore("messages", condition);

	return (
		<WrapperStyled>
			{selectedRoom?.id ? (
				<>
					<HeaderStyled>
						<div className='header__info_avt'>
							<Avatar
								className='header__avt'
								size={"large"}
								src={
									selectedRoom?.avatar === "default"
										? avatarDefault
										: selectedRoom?.avatar
								}
							/>
							<div className='header__info'>
								<p className='header__title'>{selectedRoom?.name}</p>
								<span className='header__discription'>
									{selectedRoom.description}
								</span>
							</div>
						</div>
						<ButtonGroupStyled>
							<Button
								icon={<UserAddOutlined />}
								type='text'
								onClick={() => {
									setIsInviteMemberVisible(true);
								}}>
								Mời
							</Button>
							<Avatar.Group size='small' maxCount={2}>
								{members.map((member, index) => {
									return (
										<Tooltip title={member.displayName} key={index}>
											<Avatar src={member.photoURL}></Avatar>
										</Tooltip>
									);
								})}
							</Avatar.Group>
						</ButtonGroupStyled>
					</HeaderStyled>
					<ContentStyled>
						<MessageListStyled>
							{messages.map((mes) => (
								<Message
									key={mes?.id}
									text={mes?.text}
									photoUrl={mes?.photoURL}
									displayName={mes?.displayName}
									img={mes?.img}
									createdAt={
										mes?.createdAt
											? moment(mes.createdAt.toDate()).calendar()
											: ""
									}
								/>
							))}
						</MessageListStyled>
						{/*  input message */}
						<FormStyled form={form} className='form_ipunt'>
							<Form.Item
								name='message'
								className='form_input__message'
								hidden={!isInputDefault}>
								<Input
									ref={inputRef}
									placeholder='nhập tin nhắn đi ku'
									variant={false}
									disabled={isLoading}
									autoComplete='off'
									onChange={handleInputChange}
									onPressEnter={handleOnSubmit}
								/>
							</Form.Item>
							{/* Butonn input img */}
							<Form.Item hidden={!isInputDefault}>
								<Button
									onClick={handleSetStationUInput}
									icon={<UploadOutlined />}></Button>
							</Form.Item>

							<Form.Item
								name='Image'
								style={{ flex: "1" }}
								hidden={isInputDefault}>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
									}}>
									<input
										type='file'
										multiple={true}
										style={{ display: "none" }}
										onChange={handleUploadChange}
										ref={fileInputRef}
										accept='.png,.jpg,.jpeg,.gif'
									/>
									<Button
										icon={<UploadOutlined />}
										disabled={isLoading}
										style={{ justifySelf: "center" }}
										onClick={() => fileInputRef.current.click()}>
										Chọn file
									</Button>
									<div style={{ marginLeft: "10px" }}>
										{messageImgs?.map((file, index) => (
											<div key={index}>
												{isLoading && <Spin size='small'></Spin>}
												<span> {file.name}</span>
											</div>
										))}
									</div>
								</div>
							</Form.Item>

							<Button
								type='primary'
								onClick={handleOnSubmit}
								disabled={isLoading}>
								Gửi
							</Button>
						</FormStyled>
					</ContentStyled>
				</>
			) : (
				<Alert
					message='Hãy chọn phòng'
					type='info'
					showIcon
					style={{ margin: 5 }}
					closable
				/>
			)}
		</WrapperStyled>
	);
}
