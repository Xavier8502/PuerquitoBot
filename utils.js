function ValidatePrompt(msg, flow) {
    var values;
    switch (flow) {
        case "welcome":
            values = ["HOLA", "BUENAS", "TARDES", "BUENAS TARDES", "TIENES LECHONA"];
            break;

        case "combos":
            values = ["SOLTERO", "PAREJA", "TRIO", "TRíO", "CUARTETO", "GALLADA", "MANADA", "FAMILIAR", "FIESTA"];
            break;

        case "cojines":
            values = ["20", "30", "40", "50", "60", "70", "80", "100", "120", "150"];
            break;
    }

    for (let i = 0; i < values.length; i++) {
        if (msg.toLowerCase().includes(values[i].toLowerCase())) {
            console.log(`La cadena "${msg}" contiene la palabra "${values[i]}".`);
            return true;
            break;
        }
    }
}