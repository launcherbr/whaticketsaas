import React, { useState, useEffect } from "react";

import { Avatar, CardHeader, IconButton, Tooltip } from "@material-ui/core";
import { Add as AddIcon } from "@material-ui/icons";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import { i18n } from "../../translate/i18n";
import AddUsersToTicketModal from "../AddUsersToTicketModal";
import api from "../../services/api";

const TicketInfo = ({ contact, ticket, onClick }) => {
	const { user, users } = ticket
	const [userName, setUserName] = useState('')
	const [contactName, setContactName] = useState('')
	const [modalOpen, setModalOpen] = useState(false)
	const [ticketUsers, setTicketUsers] = useState([])

	useEffect(() => {
		if (contact) {
			setContactName(contact.name);
			if(document.body.offsetWidth < 600) {
				if (contact.name.length > 10) {
					const truncadName = contact.name.substring(0, 10) + '...';
					setContactName(truncadName);
				}
			}
		}

		// Carregar usuários do ticket
		const loadTicketUsers = async () => {
			try {
				const response = await api.get(`/tickets/${ticket.id}`);
				if (response.data.ticketUsers && response.data.ticketUsers.length > 0) {
					const usersList = response.data.ticketUsers.map(tu => ({
						id: tu.user.id,
						name: tu.user.name,
						queueId: tu.queueId,
						queueName: tu.queue ? tu.queue.name : null,
						TicketUser: { queueId: tu.queueId }
					}));
					setTicketUsers(usersList);
					const usersNames = usersList.map(u => {
						const queueInfo = u.queueName ? ` (${u.queueName})` : '';
						return `${u.name}${queueInfo}`;
					}).join(", ");
					setUserName(`${i18n.t("messagesList.header.assignedTo")} ${usersNames}`);
					if(document.body.offsetWidth < 600) {
						setUserName(usersNames);
					}
				} else if (response.data.users && response.data.users.length > 0) {
					setTicketUsers(response.data.users);
					const usersNames = response.data.users.map(u => u.name).join(", ");
					setUserName(`${i18n.t("messagesList.header.assignedTo")} ${usersNames}`);
					if(document.body.offsetWidth < 600) {
						setUserName(usersNames);
					}
				} else if (user && contact) {
					setTicketUsers([user]);
					setUserName(`${i18n.t("messagesList.header.assignedTo")} ${user.name}`);
					if(document.body.offsetWidth < 600) {
						setUserName(`${user.name}`);
					}
				}
			} catch (err) {
				console.error("Erro ao carregar usuários do ticket:", err);
				if (user && contact) {
					setTicketUsers([user]);
					setUserName(`${i18n.t("messagesList.header.assignedTo")} ${user.name}`);
					if(document.body.offsetWidth < 600) {
						setUserName(`${user.name}`);
					}
				}
			}
		};

		loadTicketUsers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ticket.id])

	return (
		<>
			<CardHeader
				onClick={onClick}
				style={{ cursor: "pointer" }}
				titleTypographyProps={{ noWrap: true }}
				subheaderTypographyProps={{ noWrap: true }}
				avatar={        <Avatar
          style={{ backgroundColor: generateColor(contact?.number), color: "white", fontWeight: "bold" }}
          src={contact.profilePicUrl}
          alt="contact_image">
          {getInitials(contact?.name)}
        </Avatar>}
				title={`${contactName} #${ticket.id}`}
				subheader={
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<span>{ticket.user && `${userName}`}</span>
						{ticket.isGroup && (
							<Tooltip title="Adicionar usuário">
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										setModalOpen(true);
									}}
									style={{ padding: 4 }}
								>
									<AddIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}
					</div>
				}
			/>
			<AddUsersToTicketModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				ticketId={ticket.id}
				currentUsers={ticketUsers}
				ticket={ticket}
			/>
		</>
	);
};

export default TicketInfo;
