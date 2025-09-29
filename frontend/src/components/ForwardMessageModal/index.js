import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Autocomplete, {
	createFilterOptions,
} from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

import { FormControlLabel, Switch, Typography } from "@material-ui/core";

const ForwardMessageModal = ({ messages, onClose, modalOpen }) => {
	const [optionsContacts, setOptionsContacts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchParam, setSearchParam] = useState("");
	const [selectedContact, setSelectedContact] = useState(null);
	const [newContact, setNewContact] = useState({});
	const [contactModalOpen, setContactModalOpen] = useState(false);
	const { user } = useContext(AuthContext);
	const [sending, setSending] = useState(false);
	const [messageSending, setMessageSending] = useState('');
	const [signMessage, setSignMessage] = useState(true);

	useEffect(() => {
		if (!modalOpen || searchParam.length < 3) {
			setLoading(false);
			return;
		}
		setLoading(true);
		const delayDebounceFn = setTimeout(() => {
			const fetchContacts = async () => {
				try {
					const { data } = await api.get("contacts", {
						params: { searchParam },
					});
					setOptionsContacts(data.contacts);
					setLoading(false);
				} catch (err) {
					setLoading(false);
					toastError(err);
				}
			};

			fetchContacts();
		}, 500);
		return () => clearTimeout(delayDebounceFn);
	}, [searchParam, modalOpen]);

	const history = useHistory();

	const sleep = (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	const handleForwardMessage = async (contactL) => {
		const responseList = [];
		for (const message of messages) {
			setSending(true);
			try {
				setMessageSending(message.id);
				const response = await api.post('/message/forward', { messageId: message.id, contactId: contactL.id, signMessage: signMessage });
				responseList.push(response);
				sleep(900);
			} catch (error) {
				toastError(error);
			}
		}
		setSending(false);
		handleClose();
		// history.push('/tickets');
	}

	const handleSelectOption = (e, newValue) => {
		if (newValue?.number) {
			setSelectedContact(newValue);
		} else if (newValue?.name) {
			setNewContact({ name: newValue.name });
			setContactModalOpen(true);
		}
	};

	const handleClose = () => {
		onClose();
		setSearchParam("");
		setSelectedContact(null);
		setSending(false);
	};

	const handleCloseContactModal = () => {
		setContactModalOpen(false);
	};

	const renderOption = optionL => {
		if (optionL.number) {
			return `${optionL.name} - ${optionL.number}`;
		} else {
			return `Nenhum contato encontrado com o nome ${optionL.name}`;
		}
	};

	const renderOptionLabel = optionL => {
		if (optionL.number) {
			return `${optionL.name} - ${optionL.number}`;
		} else {
			return `${optionL.name}`;
		}
	};

	const filter = createFilterOptions({
		trim: true,
	});

	const createAddContactOption = (filterOptions, params) => {
		const filtered = filter(filterOptions, params);

		if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
			filtered.push({
				name: `${params.inputValue}`,
			});
		}

		return filtered;
	};

	return (
		<>
			<ContactModal
				open={contactModalOpen}
				initialValues={newContact}
				onClose={handleCloseContactModal}
			></ContactModal>
			<Dialog open={modalOpen} onClose={handleClose}>
				<DialogTitle id="form-dialog-title">
					Encaminhar mensagem
				</DialogTitle>
				<DialogContent dividers>
					<Autocomplete
						options={optionsContacts}
						loading={loading}
						style={{ width: 300 }}
						clearOnBlur
						autoHighlight
						freeSolo
						clearOnEscape
						getOptionLabel={renderOptionLabel}
						renderOption={renderOption}
						filterOptions={createAddContactOption}
						onChange={(e, newValue) => handleSelectOption(e, newValue)}
						renderInput={params => (
							<TextField
								{...params}
								label={i18n.t("newTicketModal.fieldLabel")}
								variant="outlined"
								autoFocus
								onChange={e => setSearchParam(e.target.value)}
								onKeyPress={e => {
									if (loading || !selectedContact) return;
									else if (e.key === "Enter") {
										// handleSaveTicket(selectedContact.id);
									}
								}}
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<React.Fragment>
											{loading ? (
												<CircularProgress color="inherit" size={20} />
											) : null}
											{params.InputProps.endAdornment}
										</React.Fragment>
									),
								}}
							/>
						)}
					/>
				</DialogContent>
				<DialogActions>
					{sending && (
						<>
							<CircularProgress color="inherit" size={20} />
							<Typography variant="body1" color="textSecondary">
								Enviando {messageSending}...
							</Typography>
						</>
					)}
					<FormControlLabel
						style={{ marginRight: 7, color: "gray" }}
						label={i18n.t("messagesInput.signMessage")}
						labelPlacement="start"
						control={
							<Switch
								size="small"
								checked={signMessage}
								onChange={(e) => {
									setSignMessage(e.target.checked);
								}}
								name="showAllTickets"
								color="primary"
							/>
						}
					/>
					<ButtonWithSpinner
						variant="contained"
						type="button"
						disabled={!selectedContact || sending}
						onClick={() => handleForwardMessage(selectedContact)}
						color="primary"
						loading={loading}
					>
						Encaminhar
					</ButtonWithSpinner>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ForwardMessageModal;