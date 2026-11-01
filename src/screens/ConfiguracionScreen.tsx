import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { supabase } from "../lib/supabase";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/Configuracion.styles";

type Props = { email: string };

export default function ConfiguracionScreen({ email }: Props) {
    const [clave, setClave] = useState("");
    const [repetir, setRepetir] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    async function cambiarClave() {
        setOk("");
        if (clave.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        if (clave !== repetir) {
            setError("Las contraseñas no coinciden");
            return;
        }
        const { error: fallo } = await supabase.auth.updateUser({ password: clave });
        if (fallo) {
            setError("No se pudo cambiar la contraseña");
            return;
        }
        setError("");
        setClave("");
        setRepetir("");
        setOk("Contraseña actualizada");
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.tarjeta}>
                <Text style={styles.titulo}>Mi cuenta</Text>
                <Text style={styles.etiqueta}>Correo</Text>
                <Text style={styles.valor}>{email}</Text>
                <Text style={styles.etiqueta}>Rol</Text>
                <Text style={styles.valor}>Administrador</Text>
            </View>

            <View style={styles.tarjeta}>
                <Text style={styles.titulo}>Cambiar contraseña</Text>
                <TextInput
                    style={comunes.input}
                    placeholder="Contraseña nueva"
                    placeholderTextColor="#A8A29E"
                    value={clave}
                    onChangeText={setClave}
                    secureTextEntry
                />
                <TextInput
                    style={comunes.input}
                    placeholder="Repite la contraseña nueva"
                    placeholderTextColor="#A8A29E"
                    value={repetir}
                    onChangeText={setRepetir}
                    secureTextEntry
                />
                <Pressable style={comunes.botonPrimario} onPress={cambiarClave}>
                    <Text style={comunes.botonPrimarioTexto}>Guardar contraseña</Text>
                </Pressable>
                {error ? <Text style={comunes.error}>{error}</Text> : null}
                {ok ? <Text style={styles.ok}>{ok}</Text> : null}
            </View>
        </ScrollView>
    );
}