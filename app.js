// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require('venom-bot');
const fs = require('fs');
const { info, Console } = require('console');
const utils = require('./utils');


venom
    .create({
        session: 'VentasPuerquito', //name of session
    })
    .then((client) => start(client))
    .catch((erro) => {
        console.log(erro);
    });

function start(client) {


    client.onMessage((message) => {

        if (message.isGroupMsg === false) {
            const sessionsInfo = fs.readFileSync('sessionInfo.json', (err, data) => {
                if (err) throw err;
            });

            var InfoClient = {
                chatId: message.chat.id,
                clientName: message.chat.contact.name,
                step: 0,
                subStep: 0,
                presentation: '',
                product: '',
                withHead: false,
                productValue: 0,
                delivery: false,
                deliveryAddress: '',
                deliveryCost: 0,
                DeliveryDate: '',
                paymentType: '',
                fullValue: 0,
                sessionidx: -1,
                active: true
            };

            var jsonData;
            var sessionidx = -1;

            if (sessionsInfo.length > 0) {
                jsonData = JSON.parse(sessionsInfo);
                var resultado;
                for (var session in jsonData) {
                    if (jsonData[session].chatId === message.chat.id) {
                        resultado = jsonData[session];
                        sessionidx = session;
                        break;
                    }
                }

                if (resultado != null) {
                    InfoClient = resultado;
                }
            }

            InfoClient.sessionidx = sessionidx;

            console.log("paso: " + InfoClient.step);
            switch (InfoClient.step) {
                case -2:
                    ClearFlow(client, InfoClient, message, jsonData);
                    break;
                case 0: //Bienvenida
                    WelcomeFlow(client, InfoClient, message, jsonData);
                    break;
                case 1: //Combos o Cojines
                    PresentationFlow(client, InfoClient, message, jsonData);
                    break;
                case 2: //Seleccionar Producto
                    ProductSelectionFlow(client, InfoClient, message, jsonData);
                    break;
                case 3: //Domicilio o Local
                    DeliveryTypeFlow(client, InfoClient, message, jsonData);
                    break;
                case 4: //Metodos de pago
                    PaymentMethodsFlow(client, InfoClient, message, jsonData);
                    break;
                case 5: //Confirmación de pedido
                    OrderConfirmationFlow(client, InfoClient, message, jsonData);
                    break;
                case 6: //Confirmación de pago
                    PaymentConfirmationFlow(client, InfoClient, message, jsonData);
                    break;
                case 7: //final de conversación
                    CloseFlow(client, InfoClient, message, jsonData);
                    break;
                case 8: //agenda entrega de cojin
                    DeliveryDateFlow(client, InfoClient, message, jsonData);
                    break;
                default:
                    console.log(data);
            }



        }
    });
}

function SaveContext(jsonData, InfoClient) {
    if (InfoClient.sessionidx === -1) {
        jsonData.push(InfoClient);
    } else {
        jsonData[InfoClient.sessionidx] = InfoClient;
    }
    fs.writeFileSync('sessionInfo.json', JSON.stringify(jsonData));
}

function WelcomeFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();
    const Saludos = ["HOLA", "BUENAS", "TARDES", "BUENOS", "LECHONA"];

    utils.ValidatePrompt(data, "welcome");

    if (Saludos.includes(data) && message.isGroupMsg === false) {
        client.sendText(message.from, 'Hola ' + InfoClient.clientName + '!').
        then(() =>
            client.sendText(message.from, '¡Bienvenido a El Puerquito Caleruno!')
            .then(() => {
                client.sendText(message.from, "¿Que deseas ordenar?\r\n\r\n1. Cojines\r\n2. Combos")
                    .then((result) => {})
                    .catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                    });
                InfoClient.step = 1;
                SaveContext(jsonData, InfoClient);
            })
            .catch((erro) => {
                console.error('Error when sending: ', erro); //return object error
            })
        );
    }

}

function PresentationFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();
    if (data === "1") {
        client.sendText(message.from, 'Esta es nuestra oferta en Cojines')
            .then(() => {
                client
                    .sendImage(
                        message.from,
                        './images/cojines.png',
                        'Combos',
                        'Por favor escoge uno (ej. 40 platos)'
                    )
                    .then((result) => {})
                    .catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                    })
            })
            .catch((erro) => { console.log("error: " + erro) });

        InfoClient.presentation = "COJINES";
    }

    if (data === "2") {
        client.sendText(message.from, 'Estos son nuestros combos')
            .then(() => {
                client
                    .sendImage(
                        message.from,
                        './images/combos.jpg',
                        'Combos',
                        'Por favor escoge uno (ej. Soltero)'
                    )
                    .then((result) => {})
                    .catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                    })
            })
            .catch((erro) => { console.log(erro) });

        InfoClient.presentation = "COMBOS";
    }
    InfoClient.step = 2;

    SaveContext(jsonData, InfoClient);
}

function ProductSelectionFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();
    const Combos = ["SOLTERO", "PAREJA", "TRIO", "TRíO", "CUARTETO", "GALLADA", "MANADA", "FAMILIAR", "FIESTA"];
    const Cojines = ["20", "30", "40", "50", "60", "70", "80", "100", "120", "150"];
    const entradaParaCojines = data.split(" ");

    if (Combos.includes(data) && message.isGroupMsg === false) {
        GetProductValue("COMBOS", data, InfoClient, jsonData);
        InfoClient.step = 3;
        InfoClient.subStep = 0;
        InfoClient.product = data;
        InfoClient.fullValue = InfoClient.productValue;
        SaveContext(jsonData, InfoClient);
        DeliveryTypeFlow(client, InfoClient, message, jsonData);
    }


    if (Cojines.includes(entradaParaCojines[0]) && message.isGroupMsg === false) {
        GetProductValue("COJINES", entradaParaCojines[0], InfoClient, jsonData);
        InfoClient.product = data;
        SaveContext(jsonData, InfoClient);

        switch (InfoClient.subStep) {
            case 0:
                const withHeadPos = ["50", "60", "70", "80", "100", "120", "150"];
                if (withHeadPos.includes(InfoClient.product.split(" ")[0]) === true) {
                    client.sendText(message.from, "Escoge una opción:\r\n1. Con Cabeza \r\n2. Sin Cabeza ")
                        .then((result) => {
                            InfoClient.subStep = 1;
                            InfoClient.product = data;
                            SaveContext(jsonData, InfoClient);
                        })
                        .catch((erro) => {
                            console.error('Error when sending: ', erro); //return object error
                        });
                } else {
                    InfoClient.step = 3;
                    InfoClient.subStep = 0;
                    SaveContext(jsonData, InfoClient);
                    DeliveryTypeFlow(client, InfoClient, message, jsonData);
                }
                break;
            case 1:
                console.log(data);
                if (data === "1") {
                    client.sendText(message.from, "Se adiciona $20.000 al valor inicial.")
                        .then((result) => {})
                        .catch((erro) => {
                            console.error('Error when sending: ', erro); //return object error
                        });
                    InfoClient.withHead = true;
                    InfoClient.productValue += 20000;
                    InfoClient.step = 3;
                    InfoClient.subStep = 0;
                    SaveContext(jsonData, InfoClient);
                    DeliveryTypeFlow(client, InfoClient, message, jsonData);
                }
                if (data === "2") {
                    InfoClient.step = 3;
                    InfoClient.subStep = 0;
                    InfoClient.withHead = false;
                    SaveContext(jsonData, InfoClient);
                    DeliveryTypeFlow(client, InfoClient, message, jsonData);
                }
        }
    } else {
        console.log("substep: " + InfoClient.subStep);
        switch (InfoClient.subStep) {
            case 1:
                console.log(data);
                if (data === "1") {
                    client.sendText(message.from, "Se adiciona $20.000 al valor inicial.")
                        .then((result) => {
                            InfoClient.withHead = true;
                            InfoClient.productValue += 20000;
                            InfoClient.step = 3;
                            InfoClient.subStep = 0;
                            SaveContext(jsonData, InfoClient);
                            DeliveryTypeFlow(client, InfoClient, message, jsonData);
                        })
                        .catch((erro) => {
                            console.error('Error when sending: ', erro); //return object error
                        });
                }
                if (data === "2") {
                    InfoClient.step = 3;
                    InfoClient.subStep = 0;
                    InfoClient.withHead = false;
                    SaveContext(jsonData, InfoClient);
                    DeliveryTypeFlow(client, InfoClient, message, jsonData);
                }
        }
    }
}

function DeliveryTypeFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();
    const deliveryInfo = fs.readFileSync('deliveryInfo.json', (err, data) => {
        if (err) throw err;
    });

    const jsonDelivery = JSON.parse(deliveryInfo);
    var isMatch = false;
    var deliveryCost = 0;
    var deliveryPlace = "";

    switch (InfoClient.subStep) {
        case 0:
            client.sendText(message.from, "¿Deseas que te llevemos el pedido?\r\n1. SI\r\n2. NO")
                .then((result) => {
                    InfoClient.subStep = 1;
                    SaveContext(jsonData, InfoClient);
                })
                .catch((erro) => {
                    console.error('Error when sending: ', erro); //return object error
                });
            break;
        case 1:
            if (data === "1") {
                client.sendText(message.from, "Escoge una Opción:\r\n1. Casco Urbano\r\n2. Vereda")
                    .then((result) => {})
                    .catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                    });
                InfoClient.delivery = true;
                InfoClient.subStep = 2;
                SaveContext(jsonData, InfoClient);
            }
            if (data === "2") {
                client.sendText(message.from, "Te esperamos en nuestro restaurante")
                    .then((result) => {
                        client
                            .sendLinkPreview(
                                message.from,
                                'https://maps.app.goo.gl/MTJNgvN1kj22YjXR7',
                                'Estamos aquí!'
                            )
                            .then((result) => {
                                if (InfoClient.presentation === "COJINES") {
                                    InfoClient.step = 8;
                                    InfoClient.subStep = 0;
                                    InfoClient.delivery = false;
                                    SaveContext(jsonData, InfoClient);
                                    DeliveryDateFlow(client, InfoClient, message, jsonData);
                                }
                                if (InfoClient.presentation === "COMBOS") {
                                    InfoClient.step = 4;
                                    InfoClient.subStep = 0;
                                    InfoClient.delivery = false;
                                    SaveContext(jsonData, InfoClient);
                                    PaymentMethodsFlow(client, InfoClient, message, jsonData);
                                }
                            })
                            .catch((erro) => {
                                console.error('Error when sending: ', erro); //return object error
                            })
                    })
                    .catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                    });
            }
            break;
        case 2:
            if (data === "1") {
                client.sendText(message.from, "El domicilio cuesta $5000 adicionales")
                    .then((res) => {
                        client.sendText(message.from, "Por favor envianos tu dirección")
                            .then(() => {})
                            .catch((erro) => { console.log(erro) })
                    })
                    .catch((erro) => { console.log("Error: " + erro) });
                InfoClient.subStep = 3;
                InfoClient.deliveryCost = 5000;
                SaveContext(jsonData, InfoClient);
            }
            if (data === "2") {


                var msj = "";

                for (var d in jsonDelivery) {
                    msj += jsonDelivery[d].name + " -- ";
                }

                client.sendText(message.from, "Tenemos domicilios disponibles para los siguientes lugares fuera del casco urbano. Si tu ubicación esta dentro de la lista, por favor digita el nombre tal cual aparece")
                    .then(() => {
                        client.sendText(message.from, msj);
                        InfoClient.subStep = 4;
                        SaveContext(jsonData, InfoClient);
                    })
                    .catch((erro) => { console.log("error: " + erro) });
            }
            break;
        case 3:
            if (InfoClient.presentation === "COJINES") {
                InfoClient.step = 6;
                InfoClient.subStep = 0;
                InfoClient.deliveryAddress = data;
                SaveContext(jsonData, InfoClient);
                DeliveryDateFlow(client, InfoClient, message, jsonData);
            }
            if (InfoClient.presentation === "COMBOS") {
                InfoClient.step = 4;
                InfoClient.subStep = 0;
                InfoClient.deliveryAddress = data;
                SaveContext(jsonData, InfoClient);
                PaymentMethodsFlow(client, InfoClient, message, jsonData);
            }
            break;
        case 4:
            for (var d in jsonDelivery) {
                if (data === jsonDelivery[d].name.toUpperCase()) {
                    isMatch = true;
                    deliveryCost = jsonDelivery[d].value;
                    deliveryPlace = jsonDelivery[d].name;
                }
            }

            if (isMatch) {
                client.sendText(message.from, "El valor para " + deliveryPlace + " es de $" + deliveryCost)
                    .then(() => {
                        client.sendText(message.from, "Continuamos?\r\n1. SI\r\n2. NO");
                        InfoClient.subStep = 5;
                        SaveContext(jsonData, InfoClient);
                    })
                    .catch((erro) => { console.log(erro) });
            } else {
                client.sendText(message.from, "Por favor envíanos tu ubicación y llámanos para terminar el pedido")
                    .then((res) => {
                        InfoClient.subStepstep = 7;
                        SaveContext(jsonData, InfoClient);
                    })
                    .catch((erro) => { console.log("Error: " + erro) });
            }
            break;
        case 5:
            if (data === "1") {
                client.sendText(message.from, "Por favor envíanos tu ubicación")
                    .then((res) => {
                        InfoClient.subStep = 6;
                        SaveContext(jsonData, InfoClient);
                    })
                    .catch((erro) => { console.log("Error: " + erro) });
            }
            if (data === "2") {
                client.sendText(message.from, "Gracias! Esperamos poder atenderte en otra ocasión")
                    .then(() => {
                        InfoClient.step = -2;
                        message.body = "LIMPIAR";
                        SaveContext(jsonData, InfoClient);
                        ClearFlow(client, InfoClient, message, jsonData);
                    });

            }
            break;
        case 6:
            if (message.type === "location") {
                if (InfoClient.presentation === "COJINES") {
                    InfoClient.step = 8;
                    InfoClient.subStep = 0;
                    InfoClient.deliveryCost = deliveryCost;
                    InfoClient.deliveryAddress = deliveryPlace;
                    SaveContext(jsonData, InfoClient);
                    DeliveryDateFlow(client, InfoClient, message, jsonData);
                }
                if (InfoClient.presentation === "COMBOS") {
                    InfoClient.step = 4;
                    InfoClient.subStep = 0;
                    InfoClient.deliveryCost = deliveryCost;
                    InfoClient.deliveryAddress = deliveryPlace;
                    SaveContext(jsonData, InfoClient);
                    PaymentMethodsFlow(client, InfoClient, message, jsonData);
                }
            }
            break;
        case 7:
            if (message.type === "location") {
                InfoClient.step = 7;
                InfoClient.subStep = 0;
                SaveContext(jsonData, InfoClient);
                CloseFlow(client, InfoClient, message);
            }
            break;
        default:
            console.log("error");
            break;
    }
    SaveContext(jsonData, InfoClient);
}

function PaymentMethodsFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();
    switch (InfoClient.subStep) {
        case 0:
            client.sendText(message.from, "Puedes pagar por medio de:\r\n\r\n1. Efectivo\r\n2. Nequi\r\n3. Daviplata")
                .then((res) => {})
                .catch((erro) => { console.log("Error enviando: " + erro) });
            InfoClient.subStep = 1;
            SaveContext(jsonData, InfoClient);
            break;
        case 1:
            InfoClient.subStep = 0;
            InfoClient.step = 5;
            if (data === "1") {
                InfoClient.paymentType = "EFECTIVO";
                SaveContext(jsonData, InfoClient);
                OrderConfirmationFlow(client, InfoClient, message, jsonData);
            }
            if (data === "2") {
                client.sendText(message.from, "Envía tu pago al NEQUI 📱 3147686244")
                    .then(() => {
                        InfoClient.paymentType = "NEQUI";
                        SaveContext(jsonData, InfoClient);
                        OrderConfirmationFlow(client, InfoClient, message, jsonData);
                    })
                    .catch((erro) => { console.log("error: " + erro) });

            }
            if (data === "3") {
                client.sendText(message.from, "Envía tu pago al DAVIPLATA 📱 3147686244")
                    .then(() => {
                        InfoClient.paymentType = "DAVIPLATA";
                        SaveContext(jsonData, InfoClient);
                        OrderConfirmationFlow(client, InfoClient, message, jsonData);
                    })
                    .catch((erro) => { console.log("error: " + erro) });
            }

            break;
    }
}

function OrderConfirmationFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();

    switch (InfoClient.subStep) {
        case 0:
            const saltodelinea = "\r\n";
            const valortotal = InfoClient.productValue + InfoClient.deliveryCost;
            const tipoEntrega = InfoClient.delivery ? "Domicilio" : "Entrega en el Local";
            const fechaentrega = InfoClient.presentation === "COJINES" ? "Fecha de entrega: " + InfoClient.DeliveryDate + saltodelinea : "";
            console.log(fechaentrega);
            const mensaje = "El resumen de tu pedido es: " +
                saltodelinea +
                "Presentación: " + InfoClient.presentation +
                saltodelinea +
                "Producto: " + InfoClient.product +
                saltodelinea +
                "Entrega: " + tipoEntrega +
                saltodelinea +
                "Lugar de entrega: " + InfoClient.deliveryAddress +
                saltodelinea +
                fechaentrega +
                "Valor: " + valortotal +
                saltodelinea +
                "Forma de Pago: " + InfoClient.paymentType;

            client.sendText(message.from, mensaje)
                .then(() => {
                    if (InfoClient.presentation === "COJINES") {
                        client.sendText(message.from, "Recuerda que para confirmar el pedido debes cancelar minimo el 50% del valor de la lechona")
                            .then(() => {
                                client.sendText(message.from, "Si es correcto, por favor confirmanos con un *SI*, de lo contraio escribe *NO*")
                                    .then(() => {})
                                    .catch((erro) => { console.log(erro) })
                            })
                            .catch((erro) => { console.log("error: " + erro) });
                    } else {
                        client.sendText(message.from, "Si es correcto, por favor confirmanos con un *SI*, de lo contraio escribe *NO*")
                            .then(() => {})
                            .catch((erro) => { console.log(erro) })
                    }
                })
                .catch((erro) => { console.log(erro) });

            InfoClient.subStep = 1;
            SaveContext(jsonData, InfoClient);
            break;
        case 1:
            if (data === "SI") {
                InfoClient.step = 6;
                InfoClient.subStep = 0;
                SaveContext(jsonData, InfoClient);
                if (InfoClient.paymentType != "EFECTIVO") {
                    PaymentConfirmationFlow(client, InfoClient, message, jsonData);
                } else {
                    CloseFlow(client, InfoClient, message, jsonData);
                }
            } else {
                if (data === "NO") {
                    client.sendText(message.from, "Por favor digita REINICIAR, para tomar de nuevo tu pedido");
                    InfoClient.step = -2;
                    SaveContext(jsonData, InfoClient);
                } else {
                    InfoClient.step = 5;
                    InfoClient.subStep = 0;
                    SaveContext(jsonData, InfoClient);
                    OrderConfirmationFlow(client, InfoClient, message, jsonData);
                }
            }
            break;
    }

}

function PaymentConfirmationFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();

    switch (InfoClient.subStep) {
        case 0:
            client.sendText(message.from, "Por favor envianos la captura de pantalla del pago");
            InfoClient.subStep = 1;
            SaveContext(jsonData, InfoClient);
            break;
        case 1:
            if (message.type === 'image') {
                InfoClient.step = 7;
                InfoClient.subStep = 0;
                SaveContext(jsonData, InfoClient);
                CloseFlow(client, InfoClient, message, jsonData);
            }
            break;

    }
}

function CloseFlow(client, InfoClient, message, jsonData) {
    if (InfoClient.presentation === "COJINES") {
        client.sendText(message.from, "Gracias!! Su pedido ha sido agendado y se entregará en la fecha acordada");
    }
    if (InfoClient.presentation === "COMBOS") {
        client.sendText(message.from, "Gracias!! Su pedido será entregado de 15 y 20 mins");
    }
    InfoClient.step = 0;
    InfoClient.active = false;
    SaveContext(jsonData, InfoClient);
}

function ClearFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();
    if (data === "REINICIAR") {
        InfoClient.step = 0;
        InfoClient.subStep = 0;
        message.body = "hola";
        SaveContext(jsonData, InfoClient);
        WelcomeFlow(client, InfoClient, message, jsonData);
    } else if (data === "LIMPIAR") {
        InfoClient.step = 0;
        InfoClient.subStep = 0;
        SaveContext(jsonData, InfoClient);
    } else {
        InfoClient.step = 5;
        InfoClient.subStep = 1;
        message.body = "NO";
        OrderConfirmationFlow(client, InfoClient, message, jsonData);
    }
}

function DeliveryDateFlow(client, InfoClient, message, jsonData) {
    const data = message.body.toUpperCase();

    switch (InfoClient.subStep) {
        case 0:
            client.sendText(message.from, "¿Para cuando necesitas la lechona? (dd/mm/yyyy)")
                .then(() => {
                    InfoClient.step = 8;
                    InfoClient.subStep = 1;
                    SaveContext(jsonData, InfoClient);
                    // DeliveryDateFlow(client, InfoClient, message, jsonData);
                })
                .catch((erro) => { console.log("error: " + erro) });
            break;

        case 1:
            const parts = data.split('/');
            const dateDelivery = new Date(parts[2], parts[1] - 1, parts[0]);
            const today = new Date();

            if (dateDelivery < today) {
                client.sendText(message.from, "La fecha de entrega debe ser mayor a hoy")
                    .then(() => {
                        InfoClient.subStep = 0;
                        SaveContext(jsonData, InfoClient);
                        DeliveryDateFlow(client, InfoClient, message, jsonData);
                    })
                    .catch((erro) => { console.log("error: " + erro) });
            } else {
                const diffInMs = dateDelivery.getTime() - today.getTime();
                const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
                if (diffInDays <= 1) {
                    client.sendText(message.from, "La fecha de entrega debe con mínimo 2 días de anticipación")
                        .then(() => {
                            InfoClient.subStep = 0;
                            SaveContext(jsonData, InfoClient);
                            DeliveryDateFlow(client, InfoClient, message, jsonData);
                        })
                        .catch((erro) => { console.log("error: " + erro) });
                } else {
                    client.sendText(message.from, "¿A que hora la necesitas?")
                        .then(() => {
                            InfoClient.DeliveryDate = data;
                            InfoClient.subStep = 2;
                            SaveContext(jsonData, InfoClient);
                        })
                        .catch((erro) => {});
                }

            }
            break;
        case 2:
            InfoClient.DeliveryDate += " " + data;
            InfoClient.step = 4;
            InfoClient.subStep = 0;
            SaveContext(jsonData, InfoClient);
            PaymentMethodsFlow(client, InfoClient, message, jsonData);
            break;
    }
}

function GetProductValue(type, name, InfoClient, jsonData) {
    const ProductsInfo = fs.readFileSync('productsInfo.json', (err, data) => {
        if (err) throw err;
    });
    jsonProducts = JSON.parse(ProductsInfo);
    for (var a in jsonProducts) {
        if (jsonProducts[a].type === type) {
            for (var b in jsonProducts[a].products) {
                if (jsonProducts[a].products[b].name === name) {
                    InfoClient.productValue = jsonProducts[a].products[b].value;
                }
            }
        }
    }
    SaveContext(jsonData, InfoClient);
}