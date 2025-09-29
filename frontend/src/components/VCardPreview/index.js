import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from "react-router-dom";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Modal from "@material-ui/core/Modal";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Button, Divider, Card, Box } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import NewTicketModal from "../NewTicketModal";
import PhoneIcon from '@material-ui/icons/Phone';
import PersonIcon from '@material-ui/icons/Person';
import ChatBubbleIcon from '@material-ui/icons/ChatBubble';

const VCardPreview = ({ contact, numbers }) => {
    const history = useHistory();
    const { user } = useContext(AuthContext);
    const theme = useTheme();

    const [selectedContact, setContact] = useState({
        name: "",
        number: 0,
        profilePicUrl: ""
    });

    const [selectedQueue, setSelectedQueue] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [isContactValid, setContactValid] = useState(true);
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
    const [contactTicket, setContactTicket] = useState({});

    const handleQueueSelection = async (queueId) => {
        setSelectedQueue(queueId);
        setModalOpen(false);
        if (queueId !== "") {
            await createTicket(queueId);
        }
    };

    const renderQueueModal = () => {
        return (
            <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
                <Card style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: theme.palette.background.paper,
                    padding: "20px",
                    outline: "none",
                    minWidth: "300px",
                    boxShadow: theme.shadows[10],
                }}>
                    <Typography variant="h6" style={{ marginBottom: "20px", color: theme.palette.text.primary }}>
                        Selecione a Fila
                    </Typography>
                    <Divider style={{ marginBottom: "20px" }} />
                    {user.queues.map((queue) => (
                        <Box key={queue.id} mb={1}>
                            <Button 
                                fullWidth
                                variant="outlined"
                                onClick={() => handleQueueSelection(queue.id)}
                                style={{
                                    justifyContent: "flex-start",
                                    color: theme.palette.text.primary,
                                    borderColor: theme.palette.divider,
                                }}
                            >
                                {queue.name}
                            </Button>
                        </Box>
                    ))}
                </Card>
            </Modal>
        );
    };

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                let contactObj = {
                    name: contact,
                    number: numbers.replace(/\D/g, ""),
                    email: ""
                };

                const { data } = await api.post("/contacts", contactObj);

                if (data.alreadyExists) {
                    setContact(data.existingContact);
                } else {
                    setContact(contactObj);
                }
            
                if(data.invalido){
                    setContactValid(false);
                }
            } catch (err) {
                toastError(err);
            }
        };

        const delayDebounceFn = setTimeout(fetchContacts, 1500);
        return () => clearTimeout(delayDebounceFn);
    }, [contact, numbers]);

    const handleNewChat = () => {
        if (selectedQueue === "") {
            setModalOpen(true);
        } else {
            createTicket();
        }
    };

    const createTicket = async (queueId) => {
        try {
            let contactId = selectedContact.id;

            if (!contactId) {
                const contactObj = {
                    name: selectedContact.name,
                    number: selectedContact.number,
                    email: ""
                };

                const { data } = await api.post("/contacts", contactObj);
                contactId = data.existingContact.id;
            }

            const { data: ticket } = await api.post("/tickets", {
                contactId,
                queueId,
                userId: user.id,
                status: "open",
            });
            
            history.push(`/tickets/${ticket.uuid}`);
        } catch (err) {
            toastError(err);
        }
    };

    const handleCloseOrOpenTicket = (ticket) => {
        setNewTicketModalOpen(false);
        if (ticket !== undefined && ticket.uuid !== undefined) {
            history.push(`/tickets/${ticket.uuid}`);
        }
    };

    return (
        <>
            {renderQueueModal()}
            <Card style={{
                minWidth: "300px",
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[3],
                borderRadius: "12px",
                overflow: "hidden",
            }}>
                <NewTicketModal
                    modalOpen={newTicketModalOpen}
                    initialContact={selectedContact}
                    onClose={(ticket) => {
                        handleCloseOrOpenTicket(ticket);
                    }}
                />
                <Box p={2}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <Avatar 
                                src={selectedContact.profilePicUrl} 
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    backgroundColor: theme.palette.primary.main,
                                }}
                            >
                                {selectedContact.name.charAt(0)}
                            </Avatar>
                        </Grid>
                        <Grid item xs>
                            <Typography 
                                variant="h6" 
                                style={{ 
                                    fontWeight: 600,
                                    color: theme.palette.text.primary,
                                }}
                            >
                                {selectedContact.name}
                            </Typography>
                            <Typography 
                                variant="body2" 
                                style={{ 
                                    color: theme.palette.text.secondary,
                                }}
                            >
                                {selectedContact.number}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Box mt={2} mb={2}>
                        <Divider style={{ backgroundColor: theme.palette.divider }} />
                    </Box>

                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center" mb={1}>
                                <PersonIcon 
                                    fontSize="small" 
                                    style={{ 
                                        marginRight: "8px",
                                        color: theme.palette.text.secondary,
                                    }} 
                                />
                                <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>
                                    <strong>Nome:</strong> {selectedContact.name}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                                <PhoneIcon 
                                    fontSize="small" 
                                    style={{ 
                                        marginRight: "8px",
                                        color: theme.palette.text.secondary,
                                    }} 
                                />
                                <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>
                                    <strong>Telefone:</strong> {selectedContact.number}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <Box mt={3}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<ChatBubbleIcon />}
                            onClick={() => {
                                setContactTicket(selectedContact);
                                setNewTicketModalOpen(true);
                            }}
                            disabled={!selectedContact.number || !isContactValid}
                            style={{
                                borderRadius: "8px",
                                padding: "10px",
                                textTransform: "none",
                                fontWeight: 600,
                                backgroundColor: isContactValid 
                                    ? theme.palette.primary.main 
                                    : theme.palette.error.main,
                                color: theme.palette.getContrastText(
                                    isContactValid 
                                        ? theme.palette.primary.main 
                                        : theme.palette.error.main
                                ),
                            }}
                        >
                            {isContactValid ? "Iniciar conversa" : "Contato inválido"}
                        </Button>
                    </Box>
                </Box>
            </Card>
        </>
    );
};

export default VCardPreview;