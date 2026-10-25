import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

type Level = 'principiante' | 'intermedio' | 'avanzado';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: la acción principal (una por vista). secondary: alternativas. ghost: acciones terciarias en línea. */
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  /** Icono a la izquierda del texto. */
  icon?: 'plus' | 'minus' | 'reset' | 'heart' | 'check' | 'bag' | 'hook';
  children: ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;

export interface BadgeProps {
  /** oliva = Principiante/Gratis · amarillo = Intermedio · rosa = Avanzado · neutral = grosor, categoría. */
  tone?: 'neutral' | 'oliva' | 'amarillo' | 'rosa';
  children: ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;

export interface TagProps {
  /** Controlado. Omítelo para que el chip gestione su propio estado. */
  selected?: boolean;
  defaultSelected?: boolean;
  onChange?: (selected: boolean) => void;
  children: ReactNode;
}
export declare function Tag(props: TagProps): JSX.Element;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
  /** Mensaje de error; sustituye a hint y marca el campo como inválido. */
  error?: string;
}
export declare function Input(props: InputProps): JSX.Element;

export interface RowCounterProps {
  /** Unidad que se cuenta. Por defecto "Vuelta". */
  label?: string;
  /** Encabezado del contador. Por defecto el plural de label. */
  title?: string;
  /** Vuelta objetivo del patrón: muestra la barra de progreso. */
  target?: number;
  initial?: number;
  onChange?: (value: number) => void;
}
export declare function RowCounter(props: RowCounterProps): JSX.Element;

export interface PatternCardProps {
  title: string;
  href?: string;
  designer?: string;
  difficulty?: Level;
  /** Ej. "4 mm". */
  hook?: string;
  /** Ej. "Algodón DK". */
  yarn?: string;
  /** Número en euros, texto libre, o 0 / "Gratis" para patrones gratuitos. */
  price?: number | string;
  /** URL de la foto del proyecto (4:3). Sin imagen se muestra la trama de puntos. */
  image?: string;
  saved?: boolean;
}
export declare function PatternCard(props: PatternCardProps): JSX.Element;

export interface YarnCardProps {
  name: string;
  /** Colores disponibles (hasta 5) como hex. */
  colors?: string[];
  color?: string;
  fiber?: string;
  /** Grosor: Lace, Fingering, DK, Worsted, Bulky… */
  weight?: string;
  meters?: string;
  hook?: string;
  price?: number | string;
  addLabel?: string;
  onAdd?: () => void;
}
export declare function YarnCard(props: YarnCardProps): JSX.Element;

export interface TutorialStepProps {
  step: number;
  title: string;
  /** Abreviaturas de los puntos usados en el paso: "pb", "aum", "cad"… */
  stitches?: string[];
  done?: boolean;
  children: ReactNode;
}
export declare function TutorialStep(props: TutorialStepProps): JSX.Element;
