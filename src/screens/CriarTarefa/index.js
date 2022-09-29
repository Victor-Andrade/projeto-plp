import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import Card from "../../components/Card";
import Input from "../../components/Input";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
import {allCategorias, createCategoria} from "../../services/CategoriaService";
import {formatDate, formatTime} from "../../util/dateFormat";
import exibirToast from "../../util/toastAndroid";
import Button from "../../components/Button";
import {useNavigation} from "@react-navigation/native";
import Modal from "../../components/Modal";
import {ColorPicker, fromHsv} from 'react-native-color-picker'
import Categoria from "../../model/models/Categoria";
import {MANHA, MEIAHORA, NOITE, TARDE, UMAHORA} from "../../model/enums/Bloco";
import Tarefa from "../../model/models/Tarefa";
import {createTarefa} from "../../services/TarefaService";

export default function CriarTarefa() {
    const [geralInfo, setGeralInfo] = useState({data_inicio: new Date(), id_categoria: 1, data_fim: null, bloco: MANHA});
    const [categoriaInfo, setCategoriaInfo] = useState({nome: "", cor: "#ff0000"});
    const [showPicker, setShowPicker] = useState(false)
    const [categorias, setCategorias] = useState([])
    const navigate = useNavigation().navigate
    const [modalVisible, setModalVisible] = useState(false)

    const [mode, setMode] = useState('date');


    // Muda setShow para true o que faz com que DateTimePicker apareça na tela.
    const showMode = (currentMode) => {
        setShowPicker(true);
        setMode(currentMode);
    };
    //Altera o modo de exibição para DatePicker
    const showDatepicker = () => {
        showMode('date');
    };
    //Altera o modo de exibição para TimePicker
    const showTimepicker = () => {
        showMode('time');
    };

    async function initData() {
        let categorias = await allCategorias()

        setCategorias(categorias)
    }

    useEffect(() => {
        initData()
        onChange(new Date(), new Date())
    }, [])

    function validations() {
        return geralInfo.id_categoria && geralInfo.data_inicio && geralInfo.bloco && geralInfo.titulo && geralInfo.descricao && geralInfo.data_fim
    }

    function validationsCategoria() {
        console.log(categoriaInfo)
        return categoriaInfo.nome && categoriaInfo.cor
    }

    function handleGeralInput(name) {
        return (value) => {
            setGeralInfo((oldGeralInfo) => ({...oldGeralInfo, [name]: value}));
        };
    }

    function handleGeralCategoriaInput(name) {
        return (value) => {
            if(name === "cor") {
                value = fromHsv(value)
            }
            setCategoriaInfo((oldGeralInfo) => ({...oldGeralInfo, [name]: value}));
        };
    }

    const onChange = (event, selectedDate) => {
        if (!selectedDate) {
            treatStartDate(selectedDate)
            setGeralInfo((oldGeralInfo) => ({...oldGeralInfo, data_inicio: geralInfo.data_inicio}));
            treatEndDate(geralInfo.data_inicio)
        } else {
            selectedDate = treatStartDate(selectedDate)
            setGeralInfo((oldGeralInfo) => ({...oldGeralInfo, data_inicio: selectedDate}));
            treatEndDate(selectedDate)
        }

        setShowPicker(false)

    }

    const renderCategoriaList = () => {
        return categorias.map((item) => {
            return <Picker.Item key={item.id} label={item.nome} value={item.id} />
        })
    }

    const renderBlocosList = () => {
        let a = [MANHA, TARDE, NOITE, MEIAHORA, UMAHORA]
        return a.map((item) => {
            return <Picker.Item key={item} label={item} value={item} />
        })
    }

    async function criarTarefa() {
        if (validations()) {
            let tarefa = new Tarefa(geralInfo)
            tarefa.data_inicio = tarefa.data_inicio.toISOString()
            tarefa.data_fim = tarefa.data_fim.toISOString()
            tarefa = await createTarefa(tarefa)
            exibirToast('Tarefa criada com sucesso!')
            console.log(tarefa)
            navigate('Metas')
        }else{
            exibirToast("Preencha todos os campos")
        }
    }

    async function salvarCategoria() {
        if (validationsCategoria()) {
            let categoria = new Categoria(categoriaInfo)
            await createCategoria(categoria)
            exibirToast('Categoria criada com sucesso!')
            await initData()
            setModalVisible(false)
        }else{
            exibirToast("Preencha todos os campos")
        }
    }

    function treatStartDate(date) {
        let holdDate = new Date(date.toISOString())
        switch (geralInfo.bloco) {
            case MANHA:
                holdDate.setHours(6)
                holdDate.setMinutes(0)
                holdDate.setSeconds(0)
                break;
            case TARDE:
                holdDate.setHours(12)
                holdDate.setMinutes(0)
                holdDate.setSeconds(0)
                break;
            case NOITE:
                holdDate.setHours(18)
                holdDate.setMinutes(0)
                holdDate.setSeconds(0)
                break;
            default:
                break;

        }
        return holdDate
    }

    function treatEndDate(data, bloco){
        let dataFim = new Date(data)
        switch (bloco ?? geralInfo.bloco) {
            case MANHA:
                dataFim.setHours(12)
                dataFim.setMinutes(0)
                dataFim.setSeconds(0)
                break;
            case TARDE:
                dataFim.setHours(18)
                dataFim.setMinutes(0)
                dataFim.setSeconds(0)
                break;
            case NOITE:
                dataFim.setHours(23)
                dataFim.setMinutes(59)
                dataFim.setSeconds(59)
                break;
            case MEIAHORA:
                dataFim.setMinutes(dataFim.getMinutes() + 30)
                break;
            case UMAHORA:
                dataFim.setHours(dataFim.getHours() + 1)
                break;
        }
        setGeralInfo((oldGeralInfo) => ({...oldGeralInfo, data_fim: dataFim}));
    }

    function handleBlocoChange(bloco){
        setGeralInfo((oldGeralInfo) => ({...oldGeralInfo, bloco: bloco}));
        treatEndDate(geralInfo.data_inicio, bloco)
    }

    return (
        <View style={{alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3%', width: '100%', maxHeight: "85%"}}>
            {showPicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={geralInfo.data_inicio}
                    mode={mode}
                    onChange={(event, date) => onChange(event, date)}
                />
            )}
            <Modal title={"Criar nova categoria"} visible={modalVisible} modalToggle={() => setModalVisible(!modalVisible)}>
                <View style={{padding: "3%", flex: 1, flexDirection: 'row', alignItems: "center"}}>
                    <View style={{flex:1, alignItems: 'center'}}>
                        <Input
                            defaultValue={categoriaInfo.nome}
                            onChangeText ={handleGeralCategoriaInput("nome")}
                            title={"nome"}
                        />
                    </View>
                    <View style={{flex: 1}}>
                        <ColorPicker
                            onColorChange={handleGeralCategoriaInput("cor")}
                            onColorSelected={handleGeralCategoriaInput("cor")}
                            defaultColor={categoriaInfo.cor}
                            style={{flex: 1}}
                        />
                    </View>
                </View>
                <Button color={"red"} onPress={salvarCategoria}>
                    <Text style={{color: 'white'}}>Salvar</Text>
                </Button>
            </Modal>
            <Card
                title={"Criar nova tarefa"}
                contentStyle={{padding: '3%', justifyContent: "flex-start"}}>
                <ScrollView>
                    <Input
                        defaultValue={geralInfo.titulo}
                        onChangeText ={handleGeralInput("titulo")}
                        title={"Título"}
                    />
                    <Input
                        multiline
                        numberOfLines={4}
                        defaultValue={geralInfo.descricao}
                        onChangeText={handleGeralInput("descricao")}
                        title={"Descrição"}
                    />

                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1}}>
                            <Text>Categoria</Text>
                            <Picker
                                selectedValue={geralInfo.id_categoria}
                                onValueChange={handleGeralInput("id_categoria")}>
                                {renderCategoriaList()}
                            </Picker>
                        </View>
                        <Button onPress={() => setModalVisible(true)} color={"blue"}>
                            <Text style={{color: "white"}}>Criar nova categoria</Text>
                        </Button>
                    </View>

                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1}}>
                            <Text>Bloco</Text>
                            <Picker
                                selectedValue={geralInfo.bloco}
                                onValueChange={handleBlocoChange}>
                                {renderBlocosList()}
                            </Picker>
                        </View>
                    </View>


                    <TouchableOpacity onPress={showDatepicker}>
                        <Input
                            editable={false}
                            selectTextOnFocus={false}
                            title={'Data de Início'}
                            defaultValue={formatDate(geralInfo.data_inicio)}
                        />
                    </TouchableOpacity>
                    {
                        geralInfo.bloco !== MANHA && geralInfo.bloco !== NOITE && geralInfo.bloco !== TARDE &&
                        <TouchableOpacity onPress={showTimepicker}>
                            <Input
                                editable={false}
                                selectTextOnFocus={false}
                                title={'Horário de início'}
                                defaultValue={formatTime(geralInfo.data_inicio)}
                            />
                        </TouchableOpacity>
                    }

                    <Input
                        editable={false}
                        selectTextOnFocus={false}
                        title={'Data final'}
                        defaultValue={geralInfo.data_fim ? formatDate( geralInfo.data_fim) + "    " + formatTime(geralInfo.data_fim): "Informe a data de início e o bloco"}
                    />
                </ScrollView>
            </Card>
            <View>
                <Button color={'red'} onPress={criarTarefa}>
                    <Text style={{color: 'white'}}>Criar Tarefa</Text>
                </Button>
            </View>
        </View>
    );
}