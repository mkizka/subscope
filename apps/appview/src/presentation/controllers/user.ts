import { Router } from "express";
import { z } from "zod";

import { UserRepository } from "../../infrastructure/user-repository.js";
import { CreateUser } from "../../usecase/create-user.js";

const router = Router();

const schema = z.object({
  did: z.string(),
});

router.post("/user", async (req, res) => {
  const userRepository = new UserRepository();
  const useCase = new CreateUser(userRepository);
  const query = schema.safeParse(req.body);
  if (query.success) {
    await useCase.execute(query.data.did);
    res.status(201).send();
  }
  res.status(400).send();
});
