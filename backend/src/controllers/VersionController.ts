import { Request, Response } from "express";

export const index = async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
        version: "7.0.0"
    });
};
