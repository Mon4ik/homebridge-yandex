import express from "express";
import fs from "fs";

import type {Logger} from "homebridge";
import axios from "axios";
import FormData from "form-data";

export function build(client_id: string, client_secret: string, oauth_path: string, logger: Logger) {
	const app = express()

	app.get("/", (req, res) => {
		res.send(`
			<h1>Looks like you are lost</h1>
			<a href="/auth">Authorize via YandexID</a>
		`)
	})

	app.get("/auth", (req, res) => {
		res.redirect(`https://oauth.yandex.ru/authorize?response_type=code&client_id=${client_id}`)
	})

	app.get("/auth/callback", async (req, res) => {
		const form = new FormData()
		form.append("grant_type", "authorization_code")
		form.append("code", req.query.code as string)
		form.append("client_id", client_id)
		form.append("client_secret", client_secret)

		const token_res = await axios.post(
			"https://oauth.yandex.ru/token",
			form,
			{
				headers: {
					...form.getHeaders()
				}
			}
		).catch((res) => res.response)


		if (token_res.data.error === undefined) {
			token_res.data

			fs.writeFileSync(
				oauth_path,
				JSON.stringify({
					access_token: token_res.data.access_token,
					refresh_token: token_res.data.refresh_token,
					expires_in: token_res.data.expires_in,
					created_in: new Date().getTime() / 1000,
				})
			)

			res.send(`
				<h1>Successfully authorized!</h1>
				<h2>Now reboot Homebridge</h2>
			`)
		} else {
			res.send(`
				<h1>Error while getting token :(</h1>
				<hr>
				<p>Error: <b>${token_res.data.error}</b></p>
				<p>Error Description: <b>${token_res.data.error_description}</b></p>
			`)
		}

	})

	app.listen(6767, () => {
		logger.info("Running OAuth server on :6767")
	})
}