import { Router } from "express";
import { z } from "zod";

import { CreateUser } from "../../usecase/create-user.js";
import { appInjector } from "../injector.js";

const router = Router();

const schema = z.object({
  did: z.string(),
});

const useCase = appInjector.injectClass(CreateUser);

router.get("/user", async (req, res) => {
  const query = schema.safeParse(req.query);
  if (query.success) {
    // eslint-disable-next-line no-console
    console.log("Creating user...");
    const user = await useCase.execute(query.data.did);
    res.status(201).json({ message: "User created", user: user });
    return;
  }
  // eslint-disable-next-line no-console
  console.log("Bad request");
  res.status(400).send();
});

export { router as userRouter };
