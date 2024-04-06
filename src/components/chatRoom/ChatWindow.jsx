import { UserAddOutlined } from "@ant-design/icons";
import { Avatar, Button, Form, Input, Tooltip, Alert } from "antd";
import styled from "styled-components";
import Message from "./Message";
import moment from "moment";
import { AppContext } from "../../context/AppProvider";
import { useContext, useState, useRef, useEffect, useMemo } from "react";
import { db } from "../../firebase/config";
import { serverTimestamp, collection, addDoc } from "firebase/firestore";

import { AuthContext } from "../../context/AuthContext";
import useFirestore from "../../hook/useFireStore";

const HeaderStyled = styled.div`
	display: flex;
	justify-content: space-between;
	height: 56px;
	padding: 0 16px;
	align-items: center;
	border-bottom: 1px solid rgb(230, 230, 230);

	.header {
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
		flex: 1;
		margin-bottom: 0;
	}
`;

export default function ChatWindow() {
	const { members, selectedRoom, setIsInviteMemberVisible } =
		useContext(AppContext);

	const { currentUser } = useContext(AuthContext);
	console.log(currentUser);

	const uid = currentUser?.uid;
	const photoURL = currentUser?.photoURL;

	const displayName = currentUser?.displayName;

	const [inputValue, setInputValue] = useState("");
	const [form] = Form.useForm();
	const inputRef = useRef(null);
	const messageListRef = useRef(null);
	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	const handleOnSubmit = async () => {
		try {
			await addDoc(collection(db, "messages"), {
				text: inputValue,
				uid,
				photoURL,
				roomId: selectedRoom?.id,
				displayName,
				createdAt: serverTimestamp(),
			});

			form.resetFields(["message"]);

			// Focus on the input again after submission
			if (inputRef?.current) {
				setTimeout(() => {
					inputRef.current.focus();
				});
			}
		} catch (error) {
			console.error("Error adding document: ", error);
		}
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
	console.log(messages);

	useEffect(() => {
		// scroll to bottom after message changed
		if (messageListRef?.current) {
			messageListRef.current.scrollTop =
				messageListRef.current.scrollHeight + 50;
		}
	}, [messages]);

	return (
		<WrapperStyled>
			{selectedRoom?.id ? (
				<>
					<HeaderStyled>
						<div className='header__info'>
							<p className='header__title'>{selectedRoom?.name}</p>
							<span className='header__discription'>
								{selectedRoom?.discription}
							</span>
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
									createdAt={
										mes?.createdAt
											? moment(mes.createdAt.toDate()).calendar()
											: ""
									}
								/>
							))}
						</MessageListStyled>
						<FormStyled form={form}>
							<Form.Item name='message'>
								<Input
									placeholder='nhập tin nhắn đi ku'
									variant={false}
									autoComplete='off'
									onChange={handleInputChange}
									onPressEnter={handleOnSubmit}
								/>
							</Form.Item>
							<Button type='primary' onClick={handleOnSubmit}>
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
