const { param } = require('express/lib/request');
const request = require('request');
const app = require('express')();

const PORT = process.env.PORT || 5000;

app.listen(PORT,
    () => console.log(`it'a alive on ${PORT}`)
)



app.get('/rastrear/:id', (req, res) => {
    const {id} = req.params;
    const options = {
        method: 'GET',
        url: `https://api.intelipost.com.br/api/v1/shipment_order/invoice/${id}`,
        headers: {
          'Content-Type': 'application/json',
          'api-key': '312a8fb1734ce968c4e2e3cf2c4a9ef6bd1efdac7d6fcde513acfdb99a4c2727'
        }
      };
    request(options, function (error, response, body) {
        if (error) {
            res.status(400).send({        
                message: "Não foi possível rastrear o pedido"
            })
        }
        res.status(200).send({        
            message: transformar_api(body)
        })
    });
    
})

function minMax(number, a, b) {
    return Math.min(Math.max(parseInt(number), a), b);
}

function transformar_api(message){
    let data = JSON.parse(message)

    let content = data.content[0]
    let end_customer = content.end_customer
    let endereco_rua = end_customer.shipping_address
    let endereco_numero = end_customer.shipping_number
    let endereco_bairro = end_customer.shipping_quarter
    let endereco_cep = end_customer.shipping_zip_code
    let endereco_cidade = end_customer.shipping_city
    let endereco_estado = end_customer.shipping_state
    
    let data_prevista = new Date(content.estimated_delivery_date_iso)

    let transportadora = content.logistic_provider_name
    let volumes_array = content.shipment_order_volume_array

    let volumes = volumes_array[0].name

    let historico_array = volumes_array[0].shipment_order_volume_state_history_array
    historico_array.reverse()
    let historico = ""
    let count = 1
    for(let j = 0; j<historico_array.length; j++) {
        let data_evento = new Date(historico_array[j].created_iso)
        let m = historico_array[j].shipment_volume_micro_state.description
        let prev_m = historico_array[minMax(j-1,0, 1000)].shipment_volume_micro_state.description
        if(m != null){
            if((m.length > 0) && ((m != prev_m))) {
                historico += `${count} - ocorrido em ${data_evento.getDay()}/${data_evento.getMonth()}/${data_evento.getUTCFullYear()} às ${data_evento.getHours()} horas - ${m} \n`
                count++
            }
        }
    }
    let client_name = `${end_customer.first_name} ${end_customer.last_name}`

    let final_message =  `Destinatário: ${client_name}
Data Prevista de Entrega: ${data_prevista.getDay()}/${data_prevista.getMonth()}/${data_prevista.getFullYear()}
Transportadora: ${transportadora}
Caminho do pedido:
${historico}
`
    console.log(final_message)
    return final_message
}
