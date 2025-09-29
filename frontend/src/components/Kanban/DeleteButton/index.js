import React from 'react';
import { IconButton, Tooltip } from "@material-ui/core";
import { Can } from "../../Can";
import { Trash } from "react-feather";
import { i18n } from "../../../translate/i18n";
import ConfirmationModal from "../../ConfirmationModal";
import { useState } from "react";
import api from "../../../services/api";
import toastError from '../../../errors/toastError';
import { toast } from "react-toastify";

export default function DeleteButton({userProfile, ticket, setTickets}) {

	const [confirmationOpen, setConfirmationOpen] = useState(false);

    const handleOpenConfirmationModal = e => {
		setConfirmationOpen(true);
		// handleClose();
	};

    const handleDeleteTicket = async () => {
		try {
			await api.delete(`/tickets/${ticket.id}`);
			setTickets(prevTickets => prevTickets.filter(item => item.id !== ticket.id ))
			toast.success("Ticket excluído com sucesso")
		} catch (err) {
			toastError(err);
		}
	};

    return (
        <>
        <Can
            role={userProfile}
            perform="ticket-options:deleteTicket"
            yes={() => (
				<Tooltip title="Excluir atendimento">
					<IconButton disableRipple edge="end" size="small" onClick={handleOpenConfirmationModal}>
						<Trash size={16} color="#4d4d4d" />
					</IconButton>
				</Tooltip>
            )}
        />
            <ConfirmationModal
				title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")}${
					ticket.id
				} ${i18n.t("ticketOptionsMenu.confirmationModal.titleFrom")} ${
					ticket.contact.name
				}?`}
				open={confirmationOpen}
				onClose={setConfirmationOpen}
				onConfirm={handleDeleteTicket}
			>
				{i18n.t("ticketOptionsMenu.confirmationModal.message")}
			</ConfirmationModal>
        </>
    )
}