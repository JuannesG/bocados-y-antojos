import { useWindowDimensions } from "react-native";
import type { Porcentaje } from "../components/TarjetaDato";

export function useBase(): Porcentaje {
    const { width } = useWindowDimensions();
    return width >= 900 ? "23.5%" : "47.5%";
}