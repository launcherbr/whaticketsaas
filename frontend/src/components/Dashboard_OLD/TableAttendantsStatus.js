import React from "react";

import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Skeleton from "@material-ui/lab/Skeleton";

import { makeStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";

import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import moment from "moment";

import Rating from "@material-ui/lab/Rating";
import { Tooltip } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    on: {
        color: green[600],
        fontSize: "20px",
    },
    off: {
        color: red[600],
        fontSize: "20px",
    },
}));

export function RatingBox({ rating }) {
    const ratingTrunc = rating && rating > 0 ? rating.toFixed(1) : 0;
    return (
        <Tooltip title={ratingTrunc} arrow>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Rating defaultValue={ratingTrunc} max={5} precision={0.1} readOnly />
            </div>
        </Tooltip>
    );
}

export default function TableAttendantsStatus(props) {
    const { loading, attendants } = props;
    const classes = useStyles();

    function renderList() {
        return attendants.map((a, k) => (
            <TableRow key={k}>
                <TableCell>{a.name}</TableCell>
                <TableCell align="center">
                    <RatingBox rating={a.rating} />
                </TableCell>
                <TableCell align="center">{formatTime(a.avgSupportTime, 2)}</TableCell>
                <TableCell align="center">
                    {a.online ? <CheckCircleIcon className={classes.on} /> : <ErrorIcon className={classes.off} />}
                </TableCell>
            </TableRow>
        ));
    }

    function formatTime(minutes) {
        return moment().startOf("day").add(minutes, "minutes").format("HH[h] mm[m]");
    }

    return !loading ? (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell align="center">Avaliações</TableCell>
                        <TableCell align="center">T.M. de Atendimento</TableCell>
                        <TableCell align="center">Status (Atual)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {renderList()}
                    {/* <TableRow>
                        <TableCell>Nome 4</TableCell>
                        <TableCell align="center">10</TableCell>
                        <TableCell align="center">10 minutos</TableCell>
                        <TableCell align="center">
                            <CheckCircleIcon className={classes.off} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Nome 5</TableCell>
                        <TableCell align="center">10</TableCell>
                        <TableCell align="center">10 minutos</TableCell>
                        <TableCell align="center">
                            <CheckCircleIcon className={classes.on} />
                        </TableCell>
                    </TableRow> */}
                </TableBody>
            </Table>
        </TableContainer>
    ) : (
        <Skeleton variant="rect" height={150} />
    );
}