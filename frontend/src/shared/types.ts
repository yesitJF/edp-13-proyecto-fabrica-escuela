export type Cuenta = { numero: string; tipo: string; saldo: number };

export type Transaccion = {
  id: string;
  fecha: string;
  tipo: "enviada" | "recibida";
  descripcion: string;
  monto: number;
  cuentaOrigen: string;
  cuentaDestino: string;
  referencia: string;
};

export type ManagerFormData = {
  cedula: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  genero: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
};

export type ManagerFormErrors = Partial<Record<keyof ManagerFormData, string>>;
