import dotenv from 'dotenv';
dotenv.config();
import venom from "venom-bot"
import { GoogleGenerativeAI } from "@google/generative-ai";
import banco from './banco.js';

venom.create({
    session: "GigaNet-BOT"
})
    .then((client) => start(client))
    .catch((error) => console.log(error))

const start = (client) => {
    client.onMessage((message) => {

        const userCadastrado = banco.find(numero => numero.num === message.from)
        if (!userCadastrado) {
            console.log("Cadastrando um Usuario")
            banco.push({ num: message.from, historico: [] })
        } else {
            console.log("Usuario já cadastrado")
        }
        const historico = banco.find(num => num.num == message.from)
        historico.historico.push("user: " + message.body)
        console.log(banco)


        const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        const connectIA = async (prompt) => {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{
                            text: `você agora é um atendente de uma provedora de internet chamada GigaNet,na sua primeira interação com o cliente faça uma lista com nossas opções de atendimento, 
                            1. Quero contratar a internet!
                            2. Mudança de endereço
                            3. ve os planos da internet
                            4. problema com a internet
                            5. falar com atendente
                            se a opção selecionada foi a 1, você ira pedir as informações pessoais do cliente: nome, cpf, telefone, endereço.
                            se a opção selecionada for a 2, voce irá perguntar para qual novo endereço ele quer mudar e internet.
                            se a opção selecionada for a 3, você mostarar a nossa tebela de preços: 50 megas por 50 reais, 80 megas por 53 reais, 350 megas por 63 reais.
                            se a opção selecionada for a 4, você perguntara qual o problema ele estar enfrentando, e em seguida transferir para um atendente humano.
                            se a opção selecionada for a 5, voce ira falar que esta transferindo para um atendente.
                            se a responsta do cliente nao for um numero de 1 a 5, repita a mensagem da primeira interação.` }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "lembre-se de sempre responder em portugues,esse é o historico de conversas: " + historico }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 100,
                },
            });

            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            const resposta = response.text();
            return resposta
        }
        const sendMessage = async () => {
            const respostaIA = await connectIA(message.body)
            client.sendText(message.from, respostaIA)
        }
        sendMessage()
    })
}
