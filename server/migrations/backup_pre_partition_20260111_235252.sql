--
-- PostgreSQL database dump
--

\restrict amGn38dUzHZoeUTIiBSF0kJNLHLAfCM7eGgLvPBoRvlQo1KOdzwZsYq2oNY1UU8

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: configuracion; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.configuracion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clave character varying(255) NOT NULL,
    valor text,
    descripcion text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.configuracion OWNER TO webops;

--
-- Name: estaciones; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.estaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(255) NOT NULL,
    zona_id uuid,
    activa boolean DEFAULT true,
    identificador_externo character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tiene_premium boolean DEFAULT true,
    tiene_magna boolean DEFAULT true,
    tiene_diesel boolean DEFAULT true
);


ALTER TABLE public.estaciones OWNER TO webops;

--
-- Name: menu_roles; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.menu_roles (
    menu_id uuid NOT NULL,
    role character varying(50) NOT NULL,
    role_id uuid NOT NULL,
    CONSTRAINT menu_roles_role_check CHECK (((role)::text = ANY ((ARRAY['Administrador'::character varying, 'GerenteEstacion'::character varying, 'GerenteZona'::character varying, 'Direccion'::character varying])::text[])))
);


ALTER TABLE public.menu_roles OWNER TO webops;

--
-- Name: menus; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    menu_id character varying(255) NOT NULL,
    tipo character varying(50) NOT NULL,
    path character varying(500),
    view_id character varying(255),
    label character varying(255) NOT NULL,
    icon character varying(100) NOT NULL,
    orden integer DEFAULT 0,
    requiere_exact_match boolean DEFAULT false,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT menus_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['route'::character varying, 'view'::character varying])::text[])))
);


ALTER TABLE public.menus OWNER TO webops;

--
-- Name: productos_catalogo; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.productos_catalogo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre_api character varying(255) NOT NULL,
    nombre_display character varying(255) NOT NULL,
    tipo_producto character varying(50) NOT NULL,
    activo boolean DEFAULT true,
    orden integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.productos_catalogo OWNER TO webops;

--
-- Name: reporte_productos; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.reporte_productos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporte_id uuid,
    producto_id uuid,
    precio numeric(10,2) NOT NULL,
    litros numeric(10,2) NOT NULL,
    importe numeric(10,2) DEFAULT 0 NOT NULL,
    merma_volumen numeric(10,2) DEFAULT 0,
    merma_importe numeric(10,2) DEFAULT 0,
    merma_porcentaje numeric(10,6) DEFAULT 0,
    iib numeric(10,2) DEFAULT 0,
    compras numeric(10,2) DEFAULT 0,
    cct numeric(10,2) DEFAULT 0,
    v_dsc numeric(10,2) DEFAULT 0,
    dc numeric(10,2) DEFAULT 0,
    dif_v_dsc numeric(10,2) DEFAULT 0,
    if numeric(10,2) DEFAULT 0,
    iffb numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    eficiencia_real numeric(10,2) DEFAULT 0,
    eficiencia_importe numeric(12,2) DEFAULT 0,
    eficiencia_real_porcentaje numeric(8,4) DEFAULT 0
);


ALTER TABLE public.reporte_productos OWNER TO webops;

--
-- Name: COLUMN reporte_productos.eficiencia_real; Type: COMMENT; Schema: public; Owner: webops
--

COMMENT ON COLUMN public.reporte_productos.eficiencia_real IS 'Eficiencia real calculada como IFFB - IF';


--
-- Name: COLUMN reporte_productos.eficiencia_importe; Type: COMMENT; Schema: public; Owner: webops
--

COMMENT ON COLUMN public.reporte_productos.eficiencia_importe IS 'Eficiencia real multiplicada por el precio del producto';


--
-- Name: COLUMN reporte_productos.eficiencia_real_porcentaje; Type: COMMENT; Schema: public; Owner: webops
--

COMMENT ON COLUMN public.reporte_productos.eficiencia_real_porcentaje IS 'Eficiencia real dividida entre litros (porcentaje)';


--
-- Name: reportes; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.reportes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    estacion_id uuid,
    fecha date NOT NULL,
    aceites numeric(10,2) DEFAULT 0,
    estado character varying(50) DEFAULT 'Pendiente'::character varying NOT NULL,
    creado_por uuid,
    revisado_por uuid,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_revision timestamp without time zone,
    comentarios text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reportes_estado_check CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'EnRevision'::character varying, 'Aprobado'::character varying, 'Rechazado'::character varying])::text[])))
);


ALTER TABLE public.reportes OWNER TO webops;

--
-- Name: reportes_auditoria; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.reportes_auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporte_id uuid,
    usuario_id uuid,
    usuario_nombre character varying(255),
    accion character varying(50) NOT NULL,
    campo_modificado character varying(100),
    valor_anterior text,
    valor_nuevo text,
    descripcion text,
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reportes_auditoria_accion_check CHECK (((accion)::text = ANY ((ARRAY['CREAR'::character varying, 'ACTUALIZAR'::character varying, 'APROBAR'::character varying, 'RECHAZAR'::character varying, 'CAMBIO_ESTADO'::character varying])::text[])))
);


ALTER TABLE public.reportes_auditoria OWNER TO webops;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    orden integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO webops;

--
-- Name: user_estaciones; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.user_estaciones (
    user_id uuid NOT NULL,
    estacion_id uuid NOT NULL
);


ALTER TABLE public.user_estaciones OWNER TO webops;

--
-- Name: user_zonas; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.user_zonas (
    user_id uuid NOT NULL,
    zona_id uuid NOT NULL
);


ALTER TABLE public.user_zonas OWNER TO webops;

--
-- Name: users; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    oauth_provider character varying(50),
    oauth_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role_id uuid,
    two_factor_secret text,
    two_factor_enabled boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Administrador'::character varying, 'GerenteEstacion'::character varying, 'GerenteZona'::character varying, 'Direccion'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO webops;

--
-- Name: zonas; Type: TABLE; Schema: public; Owner: webops
--

CREATE TABLE public.zonas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(255) NOT NULL,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.zonas OWNER TO webops;

--
-- Data for Name: configuracion; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.configuracion (id, clave, valor, descripcion, created_at, updated_at) FROM stdin;
2124b436-ac35-4783-a61c-33afabedaf8b	api_usuario	globalgas	Usuario para la API externa de Combustibles	2026-01-11 16:11:40.27432	2026-01-11 16:11:40.27432
28c265cb-48d8-4815-9ab1-114f902da295	api_contrasena	4lob@1G()5	Contraseña para la API externa de Combustibles	2026-01-11 16:11:40.294495	2026-01-11 16:11:40.294495
\.


--
-- Data for Name: estaciones; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.estaciones (id, nombre, zona_id, activa, identificador_externo, created_at, tiene_premium, tiene_magna, tiene_diesel) FROM stdin;
e86fda90-38c9-450a-bc1c-f398eb2f087a	MAGDALENA	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	10466	2026-01-11 16:26:57.594997	t	t	t
11a55b89-2ce7-4248-87f8-8c59a8f18330	AGUAMILPA	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	11326	2026-01-11 16:26:57.661309	t	t	t
64e68d24-2370-477f-97b7-59f1617013ff	JAMAY	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	11462	2026-01-11 16:26:57.66919	t	t	t
738238d9-25cd-4f00-a191-abfde4e9bed6	COLOSIO	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	12506	2026-01-11 16:26:57.694059	t	t	t
041b42ac-770c-4042-a26f-9f3f7952d990	H CASAS	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	13256	2026-01-11 16:26:57.702937	t	t	t
8f83082c-b547-4ae0-bdec-323ba98933f8	PONCITLAN 2	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	13357	2026-01-11 16:26:57.711262	t	t	t
d00edd18-e375-4553-bbf3-e4a524d4b0ac	SAN CAYETANO	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	13707	2026-01-11 16:26:57.719164	t	t	t
28ad3580-8061-4a6d-8db3-bbe367f54058	PLANETARIO	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	1526	2026-01-11 16:26:57.727881	t	t	t
5e1cef33-0274-4863-b6ef-348bc2a9216e	R MICHEL	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	1532	2026-01-11 16:26:57.736048	t	t	t
198d0d56-2e88-4ecc-9403-de4fda41624c	PONCITLAN 1	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	1603	2026-01-11 16:26:57.777894	t	t	t
3d0aa232-8b6a-4155-9b94-b47fd219292a	IXTLAN 3	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	19708	2026-01-11 16:26:57.794076	t	t	t
54c0cde6-fc6c-4b68-be01-824eff420b27	AHUACATLAN	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	2376	2026-01-11 16:26:57.811056	t	t	t
8443fc94-4834-49bc-a4fd-a830ae2305d9	IXTLAN 1	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	2383	2026-01-11 16:26:57.819563	t	t	t
b3c2dc63-ce92-4218-91f1-0b9ce3a50d6a	OCOTLAN	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	24289	2026-01-11 16:26:57.835809	t	t	t
a9e5196d-ce0b-401f-b4ec-fab3b0e169a7	8 DE JULIO	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	2791	2026-01-11 16:26:57.869569	t	t	t
9792eed5-77a4-48e6-9ccb-6026fa8f28f3	MONUMENTAL	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	3037	2026-01-11 16:26:57.886315	t	t	t
8122ef0e-2b39-473c-8467-0efdcabb66b0	CHAPALILLA	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	3164	2026-01-11 16:26:57.902856	t	t	t
38def561-e6c2-409f-85eb-a4314b3cda17	EJIDO	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	3547	2026-01-11 16:26:57.919549	t	t	t
cd01e992-d9ee-40f7-aa13-4a5030ea6de8	CENTRAL	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	3901	2026-01-11 16:26:57.952491	t	t	t
b46042b2-a78f-4e14-905c-25929890ee49	TATEPOSCO	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	7746	2026-01-11 16:26:58.169137	t	t	t
6d6610af-b1f6-4408-96fe-ae7b42017f44	RANCHO	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	7846	2026-01-11 16:26:58.194095	t	t	t
7b4124c9-7b4e-4e1a-8842-38b123114b57	LA PEÑITA	e00ab647-46d7-4d47-b7af-d1f3d1a82ada	t	8489	2026-01-11 16:26:58.219708	t	t	t
fbc0adeb-5fb5-46fc-be71-3323a9e66c2c	24 HORAS	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4249	2026-01-11 16:26:57.986347	t	t	t
560e8137-619c-4d86-8ada-d8f53764be3d	ABASOLO	d306ffa3-42aa-40b3-962a-6169036ffb74	t	24288	2026-01-11 16:26:57.829051	t	t	t
14f77980-3e47-4f46-a0ce-36721666bee4	ATEMAJAC	d306ffa3-42aa-40b3-962a-6169036ffb74	t	15615	2026-01-11 16:26:57.744243	t	t	t
4ede20dd-c902-47bd-892d-7661d0b66f17	AUTLAN	d306ffa3-42aa-40b3-962a-6169036ffb74	t	11091	2026-01-11 16:26:57.635722	t	t	t
bc7074e5-4b10-4968-9f4b-2fa9c02a0e0a	BONANZA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	10195	2026-01-11 16:26:57.574318	t	t	t
91378420-512b-4c0e-a21c-965a9249efc9	CALZADA	d306ffa3-42aa-40b3-962a-6169036ffb74	t	7435	2026-01-11 16:26:58.161378	t	t	t
1afbd69f-e12b-438b-b5ed-0deb2646f148	CAPRICHO	d306ffa3-42aa-40b3-962a-6169036ffb74	t	9879	2026-01-11 16:26:58.252913	t	t	t
eb218f9f-4910-47ff-af1a-9fbc0e102050	CASIMIRO	d306ffa3-42aa-40b3-962a-6169036ffb74	t	8611	2026-01-11 16:26:58.227499	t	t	t
2fff4e81-4f43-4e60-9ba7-45d013e445f0	CLOUTHIER	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	8302	2026-01-11 16:26:58.211472	t	t	t
7c26f913-b308-48d0-9a92-514aba4c4ce2	COLON	d306ffa3-42aa-40b3-962a-6169036ffb74	t	11805	2026-01-11 16:26:57.686305	t	t	t
c1da10fc-bb68-4233-8f8f-c26b93d2fcd0	CONSTITUYENTES	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4977	2026-01-11 16:26:58.069613	t	t	t
efe73bef-f6ed-436c-9f53-ee6f2561b276	CRESPO 1	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4684	2026-01-11 16:26:58.061536	t	t	t
0b11fdd0-2381-41c8-ad1d-6a98a6b18133	CRESPO 2	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4669	2026-01-11 16:26:58.044545	t	t	t
31ee5f60-ce34-418d-852b-89ed873dc1f5	DON BOSCO	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	3214	2026-01-11 16:26:57.910845	t	t	t
93bf467b-5397-4528-b232-133972b43567	EL GRULLO	d306ffa3-42aa-40b3-962a-6169036ffb74	t	9305	2026-01-11 16:26:58.244635	t	t	t
9768be35-7a8e-4f19-97af-d315ddedbfcf	ESTACION APASEO	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4427	2026-01-11 16:26:58.011291	t	t	t
38ee891a-3ba2-40ef-a01e-a800aa64acfe	GARZAS	d306ffa3-42aa-40b3-962a-6169036ffb74	t	6408	2026-01-11 16:26:58.086311	t	t	t
a4ec3802-bbac-49d5-b1d1-2ca21f8a3bd5	EUREKA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	998	2026-01-11 16:26:58.269031	t	t	t
45f22cd5-016a-4d04-8dc2-c62eb1df9a3c	HUESCALAPA	d306ffa3-42aa-40b3-962a-6169036ffb74	t	21004	2026-01-11 16:26:57.803058	t	t	t
ddcd60ff-75b1-4ed9-9700-cdb9e36bcd64	INDEPENDENCIA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	11158	2026-01-11 16:26:57.644552	t	t	t
4a211954-7527-4f93-a92d-e133feb11d87	GASO INDUSTRIAL	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	3135	2026-01-11 16:26:57.894525	t	t	t
398fa6be-7991-4fa8-bd11-99db2ed0b52a	GASOLINERA ZAPOTILTIC	d306ffa3-42aa-40b3-962a-6169036ffb74	t	426	2026-01-11 16:26:57.99456	t	t	t
4784eb45-e611-48d2-9cfd-af51e885d671	LA HUERTA	d306ffa3-42aa-40b3-962a-6169036ffb74	t	1593	2026-01-11 16:26:57.769609	t	t	t
90a866be-f398-474d-a219-24d5f271c97e	LA LAJA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4044	2026-01-11 16:26:57.969684	t	t	t
9e944584-a75c-474a-8faa-6d8a9a39b734	LO ARADO	d306ffa3-42aa-40b3-962a-6169036ffb74	t	1574	2026-01-11 16:26:57.761296	t	t	t
efef6cc9-f70b-4764-8ec4-db630476f0c6	MELAQUE	d306ffa3-42aa-40b3-962a-6169036ffb74	t	2557	2026-01-11 16:26:57.861274	t	t	t
3351e1a4-1ef2-43ae-b936-689fff1661fe	MARMOL	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	6582	2026-01-11 16:26:58.094102	t	t	t
1038e9aa-c5f0-4483-8b10-58cb79fda86b	MEGASERVICIO	d306ffa3-42aa-40b3-962a-6169036ffb74	t	7113	2026-01-11 16:26:58.136288	t	t	t
70869a90-c6bb-4a71-8409-81553dbd16b6	MIRAMAR	d306ffa3-42aa-40b3-962a-6169036ffb74	t	6786	2026-01-11 16:26:58.103105	t	t	t
0d4ab4b0-e579-4ce3-b512-8efe56b59ef7	MOLINA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	385	2026-01-11 16:26:57.936231	t	t	t
413d893a-79fb-4eed-a606-29bb227361a6	M CELAYA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4670	2026-01-11 16:26:58.052927	t	t	t
6a4cccf9-1b62-419f-8cb9-7c32a288780c	PALMAS	d306ffa3-42aa-40b3-962a-6169036ffb74	t	7775	2026-01-11 16:26:58.178235	t	t	t
c390d434-9260-4e69-9bc1-05c10b8daa38	PIPILA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	10940	2026-01-11 16:26:57.628283	t	t	t
5343f6a2-49db-4408-bce5-68b2278ac202	PRADERAS	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	7183	2026-01-11 16:26:58.144688	t	t	t
7f555243-cf16-44ec-bfec-14ec1702709e	PROVIDENCIA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4010	2026-01-11 16:26:57.961374	t	t	t
7a347e96-3ac5-4de3-afd2-62145554d35f	RYSVAL	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	8227	2026-01-11 16:26:58.202906	t	t	t
00a528bc-1114-4b20-b481-abe74da0c1ff	SALVATIERRA 1	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4434	2026-01-11 16:26:58.01909	t	t	t
f92dfa28-b2e1-46f0-a978-b81ee9fec785	SALVATIERRA 2	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	11210	2026-01-11 16:26:57.652911	t	t	t
5e04d805-17da-48be-a850-f5249ec89a82	SAN JAVIER	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	7799	2026-01-11 16:26:58.186147	t	t	t
dfb60f00-5227-4349-9517-1168b5a200ae	SAN RAFAEL	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	3894	2026-01-11 16:26:57.944797	t	t	t
6991571b-3fc4-4ec0-9744-c7949583b046	SERVICIO APASEO	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	382	2026-01-11 16:26:57.927459	t	t	t
a158eacc-3524-4ad3-8521-bd2a5207b140	TAMAYO 1	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4530	2026-01-11 16:26:58.036326	t	t	t
dccaab02-3e55-4c5b-94a3-0c34b6202f62	TAMAYO 2	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	11677	2026-01-11 16:26:57.677937	t	t	t
7b014b00-fbd9-4c83-bde3-0ee332d40cc6	SAYULA 1	d306ffa3-42aa-40b3-962a-6169036ffb74	t	1610	2026-01-11 16:26:57.785836	t	t	t
103a95df-93a4-49e0-8e23-2c4c1cb6ee39	TECNOLOGICO	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	4513	2026-01-11 16:26:58.027971	t	t	t
711b056b-b683-4433-93f0-2f99ec7b68a6	TECOMAN	d306ffa3-42aa-40b3-962a-6169036ffb74	t	9900	2026-01-11 16:26:58.261199	t	t	t
9c3176e2-e778-4b79-848a-2b5f9c9550ed	ULTIMO VAGON	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	7292	2026-01-11 16:26:58.15294	t	t	t
042f9c57-30ce-4847-96d1-c00c57c92ee6	SAYULA2	d306ffa3-42aa-40b3-962a-6169036ffb74	t	1611	2026-01-12 03:25:21.927162	t	t	t
3be3f6fe-ea62-4375-9a5a-2b35b33e7a71	USMAJAC	d306ffa3-42aa-40b3-962a-6169036ffb74	t	24380	2026-01-11 16:26:57.844531	t	t	t
3c8f2e28-60d2-408a-8445-75484d60844f	VILLA PURIFICACION	d306ffa3-42aa-40b3-962a-6169036ffb74	t	3028	2026-01-11 16:26:57.878601	t	t	t
f5126840-9259-4026-acfb-d1b7219136cc	VILLANUEVA	d306ffa3-42aa-40b3-962a-6169036ffb74	t	413	2026-01-11 16:26:57.978048	t	t	t
5fbce81f-4611-43ac-afee-2734d0c52c6c	Y GRIEGA	5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	t	6106	2026-01-11 16:26:58.077908	t	t	t
b60f4736-5754-458f-b980-a635ce77b6b0	ZACOALCO	d306ffa3-42aa-40b3-962a-6169036ffb74	t	25158	2026-01-11 16:26:57.852894	t	t	t
70c9e2b3-65a3-4e41-a437-2c5a0b05e15d	UNIVERSIDAD	d306ffa3-42aa-40b3-962a-6169036ffb74	t	1570	2026-01-11 16:26:57.753016	t	t	t
f704818a-fc0b-449a-b701-bdf8f496e44e	ZAPOTILTIC	d306ffa3-42aa-40b3-962a-6169036ffb74	t	427	2026-01-11 16:26:58.002937	t	t	t
\.


--
-- Data for Name: menu_roles; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.menu_roles (menu_id, role, role_id) FROM stdin;
8f397581-160d-4bdb-aecc-3932e80fb160	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
70d61372-2fc2-41a5-b619-9753944d8e5c	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
e11fce37-467f-44a3-9d7d-57ab99dc2d2c	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
4c6159e4-0280-47d7-9502-d54a80e5f939	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
4c2afece-774e-4e63-9af1-14ed903b9f07	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
ab66448e-8299-4650-a41a-755805e73955	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
804ee16a-cca4-41bd-b516-732dc8b317ad	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
5cdf3562-9e82-4d87-ade6-cb850e4eabde	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
868ed698-2216-4373-bb39-d3216bd931c6	GerenteEstacion	db466306-ca25-438c-890e-e4b67fd8422b
579067c0-90eb-444d-9971-b30e18f19d54	GerenteEstacion	db466306-ca25-438c-890e-e4b67fd8422b
dfd075ae-3509-4d24-831a-3642bfa1f4d6	GerenteEstacion	db466306-ca25-438c-890e-e4b67fd8422b
a2bfd112-c6f0-4d76-a55e-07d4c58de230	GerenteZona	4ee6811f-1401-4397-b5e9-d4ed49ddb442
ca1e05d8-56e6-447d-9428-ea15de2941c4	GerenteZona	4ee6811f-1401-4397-b5e9-d4ed49ddb442
5cdf3562-9e82-4d87-ade6-cb850e4eabde	GerenteZona	4ee6811f-1401-4397-b5e9-d4ed49ddb442
0a8439b3-9699-4a96-901e-5485e18eaa66	Direccion	0a41062b-062d-4157-a732-c591e1a975ca
f308950c-2492-4d01-a8b6-693e0f0d4c20	GerenteEstacion	db466306-ca25-438c-890e-e4b67fd8422b
f308950c-2492-4d01-a8b6-693e0f0d4c20	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
2f52b169-8fb1-4a75-9b52-a88bca632932	Administrador	f34c3713-fa81-4cd7-8c52-972e354de982
2f52b169-8fb1-4a75-9b52-a88bca632932	GerenteEstacion	db466306-ca25-438c-890e-e4b67fd8422b
2f52b169-8fb1-4a75-9b52-a88bca632932	GerenteZona	4ee6811f-1401-4397-b5e9-d4ed49ddb442
2f52b169-8fb1-4a75-9b52-a88bca632932	Direccion	0a41062b-062d-4157-a732-c591e1a975ca
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.menus (id, menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, activo, created_at, updated_at) FROM stdin;
868ed698-2216-4373-bb39-d3216bd931c6	gerente-estacion-dashboard	view	\N	dashboard	Dashboard	dashboard	0	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
579067c0-90eb-444d-9971-b30e18f19d54	gerente-estacion-reportes	view	\N	reportes	Reportes de Ventas	description	1	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
dfd075ae-3509-4d24-831a-3642bfa1f4d6	gerente-estacion-nueva-captura	view	\N	nuevaCaptura	Nueva Captura	add	2	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
a2bfd112-c6f0-4d76-a55e-07d4c58de230	gerente-zona-dashboard	view	\N	dashboard	Dashboard	dashboard	1	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
ca1e05d8-56e6-447d-9428-ea15de2941c4	gerente-zona-revision	view	\N	revision	Revisión	task_alt	2	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
5cdf3562-9e82-4d87-ade6-cb850e4eabde	gerente-zona-historial	view	\N	historial	Historial	history	3	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
0a8439b3-9699-4a96-901e-5485e18eaa66	director-resumen	view	\N	resumen	Resumen	dashboard	1	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
f308950c-2492-4d01-a8b6-693e0f0d4c20	gerente-estacion-historial	view	\N	historial	Historial	history	3	f	t	2026-01-10 03:43:10.466123	2026-01-10 05:29:02.902184
8f397581-160d-4bdb-aecc-3932e80fb160	admin-resumen	route	/admin	\N	Resumen	dashboard	1	t	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
2f52b169-8fb1-4a75-9b52-a88bca632932	reporte-eficiencia	route	/reporte-eficiencia	\N	Eficiencia	monitoring	4	f	t	2026-01-11 15:49:32.283504	2026-01-11 15:49:32.283504
70d61372-2fc2-41a5-b619-9753944d8e5c	admin-reportes	route	/admin/reportes	\N	Reportes	description	3	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
e11fce37-467f-44a3-9d7d-57ab99dc2d2c	admin-configuracion	route	/admin/configuracion	\N	Configuración	settings	5	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
4c6159e4-0280-47d7-9502-d54a80e5f939	admin-logs	route	/admin/logs	\N	Logs	history	7	f	t	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
4c2afece-774e-4e63-9af1-14ed903b9f07	admin-usuarios	route	/admin/usuarios	\N	Usuarios	people	2	f	f	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
ab66448e-8299-4650-a41a-755805e73955	admin-zonas	route	/admin/zonas-estaciones	\N	Zonas	location_on	4	f	f	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
804ee16a-cca4-41bd-b516-732dc8b317ad	admin-productos	route	/admin/productos	\N	Productos	inventory_2	6	f	f	2026-01-10 03:43:10.466123	2026-01-10 03:43:10.466123
\.


--
-- Data for Name: productos_catalogo; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.productos_catalogo (id, nombre_api, nombre_display, tipo_producto, activo, orden, created_at, updated_at) FROM stdin;
cc685ee6-27ad-465d-9ecc-1a7abe8809ba	91 Octanos	Premium	premium	t	0	2026-01-10 03:43:10.458523	2026-01-10 03:43:10.458523
a8e9ece3-c380-495c-b76e-713d7e322e98	87 Octanos	Magna	magna	t	0	2026-01-10 03:43:10.458523	2026-01-10 03:43:10.458523
5673f079-eac8-4a64-b47c-ebcfcbb85c31	Diesel	Diesel	diesel	t	0	2026-01-10 03:43:10.458523	2026-01-10 03:43:10.458523
\.


--
-- Data for Name: reporte_productos; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.reporte_productos (id, reporte_id, producto_id, precio, litros, importe, merma_volumen, merma_importe, merma_porcentaje, iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb, created_at, updated_at, eficiencia_real, eficiencia_importe, eficiencia_real_porcentaje) FROM stdin;
7ab73cf6-bda5-4593-b196-6dff92a7745b	ad69d72a-16f1-467f-a207-8baf9e5011e8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	927.65	24944.35	34.74	934.10	3.744700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.233548	2026-01-12 04:10:51.233548	0.00	0.00	0.0000
fc57a9f1-5dec-4926-b8ac-6a9476346581	ad69d72a-16f1-467f-a207-8baf9e5011e8	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6351.17	152366.06	128.81	3090.01	2.028000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.240302	2026-01-12 04:10:51.240302	0.00	0.00	0.0000
81191329-3b8e-4001-848d-347db92ef54a	ad69d72a-16f1-467f-a207-8baf9e5011e8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	2181.62	58882.05	3.70	100.00	0.169800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.248468	2026-01-12 04:10:51.248468	0.00	0.00	0.0000
3ecc4cf8-a712-4bed-a9ca-37cb56a24cce	acde514a-2026-456d-83e4-eadefaac15fe	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.67	2655.36	70819.23	150.62	4017.15	5.672300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.274724	2026-01-12 04:10:51.274724	0.00	0.00	0.0000
ab33b680-cc6f-4dd1-b09d-2073df5a335e	acde514a-2026-456d-83e4-eadefaac15fe	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	9396.40	230119.86	494.33	12106.25	5.260800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.282105	2026-01-12 04:10:51.282105	0.00	0.00	0.0000
08848cb2-b406-4cba-9ffd-2aca0d466198	acde514a-2026-456d-83e4-eadefaac15fe	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.37	12064.61	318144.07	299.69	7902.79	2.484000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.290116	2026-01-12 04:10:51.290116	0.00	0.00	0.0000
e4ac4a2a-841a-440b-bfc7-064935473a56	7911d981-ff9c-41b9-b204-4d4c42899a48	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.39	793.45	20939.14	25.53	673.82	3.217900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.316535	2026-01-12 04:10:51.316535	0.00	0.00	0.0000
3b277e9c-0a25-4751-9346-59bb42879015	7911d981-ff9c-41b9-b204-4d4c42899a48	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5273.88	126522.63	233.41	5599.54	4.425700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.323574	2026-01-12 04:10:51.323574	0.00	0.00	0.0000
9d61ea33-563f-480e-b6d4-0b2078b49559	7911d981-ff9c-41b9-b204-4d4c42899a48	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	2548.95	68796.27	40.75	1099.98	1.598800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.332005	2026-01-12 04:10:51.332005	0.00	0.00	0.0000
c6b4aa18-a292-49df-9ee4-f3f27474d027	12e0746f-99c9-4389-a670-86fc8a015e10	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.09	2104.20	54899.34	48.41	1263.10	2.300700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.399985	2026-01-12 04:10:51.399985	0.00	0.00	0.0000
d1ee4d46-f8c0-4a8e-879a-73657ab196cd	12e0746f-99c9-4389-a670-86fc8a015e10	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10515.51	252269.65	433.57	10401.28	4.123000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.407881	2026-01-12 04:10:51.407881	0.00	0.00	0.0000
561ad06f-fea3-4c83-b141-a6b642e2bbe4	12e0746f-99c9-4389-a670-86fc8a015e10	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	1809.43	48836.88	27.61	745.27	1.526000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.416143	2026-01-12 04:10:51.416143	0.00	0.00	0.0000
58a16bae-590c-4a17-85d7-46896eb2347e	7ed99cc7-6a72-4773-9acf-1a52b303bedf	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.432515	2026-01-12 04:10:51.432515	0.00	0.00	0.0000
6f3e2309-2b36-47b4-984d-194d37d7124c	7ed99cc7-6a72-4773-9acf-1a52b303bedf	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8713.40	209037.57	353.27	8474.98	4.054200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.440555	2026-01-12 04:10:51.440555	0.00	0.00	0.0000
45ac2b5d-7ade-4656-8058-5ce42b2abd5d	7ed99cc7-6a72-4773-9acf-1a52b303bedf	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.448962	2026-01-12 04:10:51.448962	0.00	0.00	0.0000
4bc6eef4-bff1-4841-9c5f-af22fd7ff55e	0a537c23-299f-4193-bb11-e7ca8104895f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.49	808.95	21429.26	33.03	875.07	4.083500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.467105	2026-01-12 04:10:51.467105	0.00	0.00	0.0000
a683f96d-71ea-463f-af65-14ad9d9536ca	0a537c23-299f-4193-bb11-e7ca8104895f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3446.36	82679.41	157.71	3783.32	4.575800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.474413	2026-01-12 04:10:51.474413	0.00	0.00	0.0000
346212e1-44ae-4088-b1a1-67253c2e8371	0a537c23-299f-4193-bb11-e7ca8104895f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	2790.00	75302.03	51.38	1386.66	1.841400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.483141	2026-01-12 04:10:51.483141	0.00	0.00	0.0000
a74a4c37-194b-47a1-a2ba-3457cfdda3b1	75e49a26-bf3f-4d91-80ff-4d9931d453ce	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	954.91	25391.16	37.00	983.88	3.874800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.508914	2026-01-12 04:10:51.508914	0.00	0.00	0.0000
168d443b-211b-4441-ac6f-a7f48e655398	75e49a26-bf3f-4d91-80ff-4d9931d453ce	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6764.29	162277.50	317.97	7628.05	4.700600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.516259	2026-01-12 04:10:51.516259	0.00	0.00	0.0000
312837a4-c5e6-4e6f-8611-041efdd198c2	75e49a26-bf3f-4d91-80ff-4d9931d453ce	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.69	5502.61	146865.02	169.16	4514.81	3.074100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.524479	2026-01-12 04:10:51.524479	0.00	0.00	0.0000
76d5533c-03c1-4f1a-83a2-8f3e8ab76d1a	10833a40-10dd-4bcf-82bf-7e20bd05fe15	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	392.15	10450.70	21.18	564.50	5.401500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.551087	2026-01-12 04:10:51.551087	0.00	0.00	0.0000
43ca56bf-effc-4ef1-9a8f-0347f8909c66	10833a40-10dd-4bcf-82bf-7e20bd05fe15	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3807.86	91351.56	144.24	3460.22	3.787800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.557941	2026-01-12 04:10:51.557941	0.00	0.00	0.0000
8d34fd83-9d7a-4613-9b17-88632db6e9cd	10833a40-10dd-4bcf-82bf-7e20bd05fe15	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	3012.39	81304.64	86.70	2339.90	2.877900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.566524	2026-01-12 04:10:51.566524	0.00	0.00	0.0000
76e27ead-fee3-4766-95b9-67fe62589918	09ee7f4c-3b69-4281-93f7-4e01475255c0	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	1935.02	52671.42	73.22	1992.99	3.783800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.592798	2026-01-12 04:10:51.592798	0.00	0.00	0.0000
1333dc4c-2bac-44ef-b96f-45eef607c28b	09ee7f4c-3b69-4281-93f7-4e01475255c0	a8e9ece3-c380-495c-b76e-713d7e322e98	23.98	5493.67	131740.25	196.22	4705.40	3.571700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.599772	2026-01-12 04:10:51.599772	0.00	0.00	0.0000
947a7747-13ef-477d-8dd3-659e2fb40fa6	09ee7f4c-3b69-4281-93f7-4e01475255c0	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1144.71	31101.78	60.73	1649.98	5.305000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.608048	2026-01-12 04:10:51.608048	0.00	0.00	0.0000
4a04f308-1227-4b65-a09b-b389936e77a0	2db4d26e-08d3-4e1b-8837-e2bec5e51948	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.49	1721.52	45603.29	86.69	2296.47	5.035700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.633846	2026-01-12 04:10:51.633846	0.00	0.00	0.0000
f876a653-bd5d-4829-b75f-ab6ef92e812c	2db4d26e-08d3-4e1b-8837-e2bec5e51948	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3922.05	94092.42	167.44	4016.85	4.269000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.641547	2026-01-12 04:10:51.641547	0.00	0.00	0.0000
5f1ac253-6083-44d9-a92a-07fa7b0e19a1	2db4d26e-08d3-4e1b-8837-e2bec5e51948	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	402.01	10995.01	13.48	368.77	3.353900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.649825	2026-01-12 04:10:51.649825	0.00	0.00	0.0000
c910c340-4c2a-4fb0-92a5-eea0c11116ab	3bab1322-6522-461f-8c8c-efb79f6f834d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	2411.23	64112.94	104.47	2777.93	4.332800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.675941	2026-01-12 04:10:51.675941	0.00	0.00	0.0000
e2a157e4-9bab-4ed2-bcd0-27da5822de59	3bab1322-6522-461f-8c8c-efb79f6f834d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5436.66	130415.18	221.21	5306.78	4.069100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.683248	2026-01-12 04:10:51.683248	0.00	0.00	0.0000
0de04aac-8f5c-44a5-b4a0-76bd52ec6605	3bab1322-6522-461f-8c8c-efb79f6f834d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	583.25	15951.78	10.31	281.98	1.767700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.691541	2026-01-12 04:10:51.691541	0.00	0.00	0.0000
16c152f1-4ca5-481e-9aaf-974e694b5f5b	80096553-8199-4f4b-bbf8-1fa2ef6cd7ca	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	1167.14	31499.45	61.25	1653.25	5.248500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.717772	2026-01-12 04:10:51.717772	0.00	0.00	0.0000
eb854d3c-6af6-4c8c-9ab3-669d9db72072	80096553-8199-4f4b-bbf8-1fa2ef6cd7ca	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5340.84	128116.02	232.38	5574.82	4.351300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.724905	2026-01-12 04:10:51.724905	0.00	0.00	0.0000
4336d2d2-da50-47c2-aaab-09460e9cdf07	80096553-8199-4f4b-bbf8-1fa2ef6cd7ca	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.79	3344.66	89603.04	52.99	1419.68	1.584400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.733272	2026-01-12 04:10:51.733272	0.00	0.00	0.0000
94acf565-7054-458e-8dbb-794c0df91b1f	202425f6-a253-4c54-a45e-d602e087ccaf	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.75912	2026-01-12 04:10:51.75912	0.00	0.00	0.0000
e5754f4f-9960-4d2c-8d45-ad587d0272ff	202425f6-a253-4c54-a45e-d602e087ccaf	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6111.71	146615.91	283.33	6796.92	4.635800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.76652	2026-01-12 04:10:51.76652	0.00	0.00	0.0000
bc067a4b-2b21-4916-b4d4-b0fc04860e2d	202425f6-a253-4c54-a45e-d602e087ccaf	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	5167.43	139469.02	160.95	4344.09	3.114700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.774959	2026-01-12 04:10:51.774959	0.00	0.00	0.0000
4206f07b-e19d-4262-b3d4-3db784acf1c5	f4973e83-6908-4fb7-a106-ca022f00b14c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	7549.44	203761.86	302.19	8156.26	4.002800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.800774	2026-01-12 04:10:51.800774	0.00	0.00	0.0000
3078ae64-ebc4-4874-8ed2-6fe718ad8536	f4973e83-6908-4fb7-a106-ca022f00b14c	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	16233.88	397569.22	774.48	18967.26	4.770800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.808001	2026-01-12 04:10:51.808001	0.00	0.00	0.0000
a66523f2-a344-406b-832e-cfb04eaccaf1	f4973e83-6908-4fb7-a106-ca022f00b14c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.89	18715.52	503260.58	98.82	2657.02	0.527900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.816818	2026-01-12 04:10:51.816818	0.00	0.00	0.0000
e0c4aa3f-fe94-4d02-8508-9651b26042a1	0c21bc50-0401-4862-9165-901efb96ce21	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.74	890.27	23806.16	49.36	1319.97	5.544600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.842428	2026-01-12 04:10:51.842428	0.00	0.00	0.0000
d0faf589-6733-4cbf-90a4-477fae8914ca	0c21bc50-0401-4862-9165-901efb96ce21	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2755.19	66098.01	158.47	3801.54	5.751300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.849956	2026-01-12 04:10:51.849956	0.00	0.00	0.0000
60b4d1a0-da6c-4a24-9416-e4eb9e9b4825	0c21bc50-0401-4862-9165-901efb96ce21	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.19	5806.26	152066.06	38.19	1000.06	0.657600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.858309	2026-01-12 04:10:51.858309	0.00	0.00	0.0000
fc1cf272-3cc6-4f16-885e-0406c349ec2d	34527ab2-8507-4f96-beab-257ffab4641e	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	1273.56	33992.41	72.69	1940.07	5.707300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.884033	2026-01-12 04:10:51.884033	0.00	0.00	0.0000
566ae35a-58b0-4860-b597-3e999ff98bac	34527ab2-8507-4f96-beab-257ffab4641e	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7910.67	189779.79	304.47	7304.14	3.848700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.891238	2026-01-12 04:10:51.891238	0.00	0.00	0.0000
2439fc79-3f75-4808-8188-f4e50786513e	34527ab2-8507-4f96-beab-257ffab4641e	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.84	3362.24	90242.44	128.58	3451.05	3.824100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.900041	2026-01-12 04:10:51.900041	0.00	0.00	0.0000
7f55827d-624a-4c00-8a61-90dc92583940	cd36098c-63c0-4323-950e-1cf6eb98d72c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	2170.10	58378.27	99.32	2671.64	4.576400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.917266	2026-01-12 04:10:51.917266	0.00	0.00	0.0000
75e38eb9-fbdd-4fb1-99ec-fc906fe368ef	cd36098c-63c0-4323-950e-1cf6eb98d72c	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6028.71	144631.86	336.32	8068.20	5.578400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.924544	2026-01-12 04:10:51.924544	0.00	0.00	0.0000
9c57686d-cbea-4259-bcc1-c7257d7b68b5	cd36098c-63c0-4323-950e-1cf6eb98d72c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	537.45	14613.46	15.51	421.68	2.885500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.933218	2026-01-12 04:10:51.933218	0.00	0.00	0.0000
1ef5eeb2-9b81-4a14-90b2-d2c9b50a0553	07b93af4-efbf-4002-b368-6590a50316af	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.95	2391.37	64447.12	169.61	4571.03	7.092600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.959082	2026-01-12 04:10:51.959082	0.00	0.00	0.0000
98d29c32-d5aa-42a5-89b4-13e1d8229f86	07b93af4-efbf-4002-b368-6590a50316af	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4736.17	113619.62	277.64	6660.61	5.862200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.966229	2026-01-12 04:10:51.966229	0.00	0.00	0.0000
4fe8778d-bd4e-4120-bfd9-8d7562dc7648	07b93af4-efbf-4002-b368-6590a50316af	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.24	5674.87	154582.90	228.43	6222.51	4.025300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:51.975067	2026-01-12 04:10:51.975067	0.00	0.00	0.0000
68a5a678-b14c-4cf8-aeda-a661343ce7a7	2634384f-ac35-4fc2-b637-9afc1638b61f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.95	1756.26	47328.35	110.44	2976.31	6.288600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.000752	2026-01-12 04:10:52.000752	0.00	0.00	0.0000
e27d0486-3eff-4531-873e-4af7d6742c1a	2634384f-ac35-4fc2-b637-9afc1638b61f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6847.08	164248.91	409.77	9830.33	5.985000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.008355	2026-01-12 04:10:52.008355	0.00	0.00	0.0000
e135e0ea-275c-4c39-a1c8-462a6547c584	2634384f-ac35-4fc2-b637-9afc1638b61f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.24	1172.57	31940.83	37.69	1026.70	3.214300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.016802	2026-01-12 04:10:52.016802	0.00	0.00	0.0000
f83813ae-1e8a-4515-b5f7-15cd319c6db7	b00775bc-02aa-415d-8037-7bf025adcb65	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3914.09	105642.81	202.48	5464.93	5.173000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.042222	2026-01-12 04:10:52.042222	0.00	0.00	0.0000
a6a9da46-b95e-4a85-bc4f-d7e8440640f2	b00775bc-02aa-415d-8037-7bf025adcb65	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	13304.97	319191.48	669.31	16056.61	5.030400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.050027	2026-01-12 04:10:52.050027	0.00	0.00	0.0000
38998576-0f8a-4638-88ee-d271b863ebfb	b00775bc-02aa-415d-8037-7bf025adcb65	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.79	6003.35	160829.75	196.95	5276.18	3.280500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.058459	2026-01-12 04:10:52.058459	0.00	0.00	0.0000
af20606b-48b1-4f06-b5e7-45d51f4cc697	bc723d31-4a9a-4071-906a-851d1376dd14	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.075839	2026-01-12 04:10:52.075839	0.00	0.00	0.0000
c2191bd8-3452-4f66-8c15-1cfcd51b99fb	bc723d31-4a9a-4071-906a-851d1376dd14	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	14446.29	346546.72	692.74	16618.83	4.795500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.083038	2026-01-12 04:10:52.083038	0.00	0.00	0.0000
39e41bed-a66b-4874-84ab-1fae717df09b	bc723d31-4a9a-4071-906a-851d1376dd14	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.64	12867.77	342796.74	153.48	4088.66	1.192700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.091571	2026-01-12 04:10:52.091571	0.00	0.00	0.0000
ef67b32c-4a47-4c3b-8821-ab9d585a4853	4df0b612-0143-4099-9170-fa42287cd4c1	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	3833.64	102316.25	239.03	6379.56	6.235100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.127834	2026-01-12 04:10:52.127834	0.00	0.00	0.0000
014201a5-b215-4666-91af-e8bcc83c6ab8	4df0b612-0143-4099-9170-fa42287cd4c1	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4514.41	108294.79	248.87	5970.23	5.512900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.134797	2026-01-12 04:10:52.134797	0.00	0.00	0.0000
5ea8c5f5-0952-4e68-876c-e8a101271fc8	4df0b612-0143-4099-9170-fa42287cd4c1	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.14343	2026-01-12 04:10:52.14343	0.00	0.00	0.0000
466f7b44-de4b-4bc6-8c6d-631d59499ad8	b79c164b-41d5-412f-8790-a06e9b473646	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	1898.83	51250.43	75.02	2024.65	3.950500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.169103	2026-01-12 04:10:52.169103	0.00	0.00	0.0000
e41cef56-86b0-4a24-ba48-901ebdb7bee5	b79c164b-41d5-412f-8790-a06e9b473646	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	5104.68	125014.99	137.19	3359.69	2.687400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.176664	2026-01-12 04:10:52.176664	0.00	0.00	0.0000
51e44e60-abff-4d86-b96f-6d2242fb51ea	b79c164b-41d5-412f-8790-a06e9b473646	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	1023.68	27997.82	17.79	486.45	1.737400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.185263	2026-01-12 04:10:52.185263	0.00	0.00	0.0000
1e53834f-7d4a-4a4b-b7e9-fada5f433b78	af967188-3107-4ac6-92a4-43b91749919d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.09	2230.39	60421.55	101.61	2752.61	4.555600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.211221	2026-01-12 04:10:52.211221	0.00	0.00	0.0000
7962a7e9-3baf-44a0-8765-9e85d5bf0721	af967188-3107-4ac6-92a4-43b91749919d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8505.67	204052.87	396.52	9512.43	4.661700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.218489	2026-01-12 04:10:52.218489	0.00	0.00	0.0000
2f49a333-5588-4e4c-acc7-8af74dab5962	af967188-3107-4ac6-92a4-43b91749919d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1751.95	47600.60	82.83	2250.41	4.727600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.226718	2026-01-12 04:10:52.226718	0.00	0.00	0.0000
c1024fab-b8b0-4d47-bb3b-875167424ecc	cf856f2c-21aa-404c-bd08-3bbf472f2edb	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2659.66	71785.03	157.93	4262.53	5.937900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.252552	2026-01-12 04:10:52.252552	0.00	0.00	0.0000
1196367f-11e4-4edd-88c9-cfd13cd419c4	cf856f2c-21aa-404c-bd08-3bbf472f2edb	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	11098.71	271809.28	508.82	12461.06	4.584400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.260088	2026-01-12 04:10:52.260088	0.00	0.00	0.0000
2ef9b8bd-3e04-4a83-98e1-b01dbf3e3d9f	cf856f2c-21aa-404c-bd08-3bbf472f2edb	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	4557.14	124638.09	179.70	4914.66	3.943100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.268494	2026-01-12 04:10:52.268494	0.00	0.00	0.0000
eedc1a2b-8a52-40db-91fb-886499ecff01	ed847c1b-537e-469a-bc7a-d0a3e102a2f8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2619.12	70690.89	129.38	3492.01	4.939800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.285878	2026-01-12 04:10:52.285878	0.00	0.00	0.0000
fec63398-b897-47f8-af1d-73eaa5cadbab	ed847c1b-537e-469a-bc7a-d0a3e102a2f8	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	6939.38	169946.74	572.97	14032.20	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.293237	2026-01-12 04:10:52.293237	0.00	0.00	0.0000
b2876294-338f-4d71-83f6-bfb3f622b4ee	ed847c1b-537e-469a-bc7a-d0a3e102a2f8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	3323.69	90903.52	110.02	3009.16	3.310200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.301479	2026-01-12 04:10:52.301479	0.00	0.00	0.0000
fb88a890-8ab3-435e-a0cc-2f70844365c5	33a262a4-77be-4bbc-b53f-779e7779d4dd	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	3742.96	101883.98	202.33	5507.44	5.405500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.319027	2026-01-12 04:10:52.319027	0.00	0.00	0.0000
92438730-7ba3-49f3-b427-0ab14dcba354	33a262a4-77be-4bbc-b53f-779e7779d4dd	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11912.12	285775.88	575.32	13801.71	4.829500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.326762	2026-01-12 04:10:52.326762	0.00	0.00	0.0000
aab70bf9-9dbb-4b75-9da2-a197f7a99008	33a262a4-77be-4bbc-b53f-779e7779d4dd	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1284.56	34901.64	40.69	1105.41	3.167200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.335211	2026-01-12 04:10:52.335211	0.00	0.00	0.0000
d17dfbdb-943e-4b62-9b0f-c75f96f9ca85	eeb7af79-c8d2-40f9-80ae-ed8e173c9e73	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2771.49	74803.78	43.76	1181.14	1.578900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.361188	2026-01-12 04:10:52.361188	0.00	0.00	0.0000
7aa7df66-69d3-483c-bcb2-5db024aa871a	eeb7af79-c8d2-40f9-80ae-ed8e173c9e73	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	12071.42	295631.79	309.62	7582.64	2.564800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.368108	2026-01-12 04:10:52.368108	0.00	0.00	0.0000
d6e88d4b-30fe-4a42-89ea-6c303f375aae	eeb7af79-c8d2-40f9-80ae-ed8e173c9e73	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.34	1198.22	31561.12	53.34	1404.98	4.451600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.376869	2026-01-12 04:10:52.376869	0.00	0.00	0.0000
cbd900c0-c736-4b5b-aad1-5e7d307d3060	a8bddc97-48b7-40f2-aaa1-78ff04e361bc	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.403	2026-01-12 04:10:52.403	0.00	0.00	0.0000
2673a44a-b006-4a9d-af38-6ee9111778d1	a8bddc97-48b7-40f2-aaa1-78ff04e361bc	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6269.20	150400.40	269.83	6473.25	4.304000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.410079	2026-01-12 04:10:52.410079	0.00	0.00	0.0000
8bd10581-a088-419e-97cc-1394754e65a7	a8bddc97-48b7-40f2-aaa1-78ff04e361bc	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	1617.93	43668.11	38.09	1028.13	2.354400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.418427	2026-01-12 04:10:52.418427	0.00	0.00	0.0000
befe0194-05bc-492a-b7db-a9bf89d14db1	8824434b-110a-40b8-afc8-8bd07e80e546	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	5260.04	140393.38	297.75	7946.76	5.660300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.444242	2026-01-12 04:10:52.444242	0.00	0.00	0.0000
609e4ad7-5b5e-4b94-9153-af381ae16fb1	8824434b-110a-40b8-afc8-8bd07e80e546	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	21405.97	513533.49	858.11	20586.05	4.008700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.452003	2026-01-12 04:10:52.452003	0.00	0.00	0.0000
0bd2635b-7f38-4925-bcbc-33c349e82eef	8824434b-110a-40b8-afc8-8bd07e80e546	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.84	6179.77	165865.15	199.38	5351.48	3.226400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.460222	2026-01-12 04:10:52.460222	0.00	0.00	0.0000
525e4a4f-71f7-4ec4-a0b4-eaf52edfd5ff	59b65c2c-773a-468c-9242-85f0f58edc7d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.75	5827.35	155879.27	322.94	8638.60	5.541800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.486273	2026-01-12 04:10:52.486273	0.00	0.00	0.0000
928cb070-a994-4a4b-80f5-8e4b988d3227	59b65c2c-773a-468c-9242-85f0f58edc7d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	9337.96	224008.53	660.91	15855.04	7.077800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.493512	2026-01-12 04:10:52.493512	0.00	0.00	0.0000
c8c0fb96-fd37-4fb0-bf64-c0133c53554a	59b65c2c-773a-468c-9242-85f0f58edc7d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.95	8363.82	225404.23	58.81	1584.87	0.703100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.50187	2026-01-12 04:10:52.50187	0.00	0.00	0.0000
4079c654-e378-4dce-b198-908f59cbea8d	3cad4145-712b-4bee-ba78-4eeffd65bbea	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.519132	2026-01-12 04:10:52.519132	0.00	0.00	0.0000
da36f28c-cf00-4f0a-bc5e-129681e50013	3cad4145-712b-4bee-ba78-4eeffd65bbea	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	15281.15	374235.73	984.34	24108.22	6.441900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.526529	2026-01-12 04:10:52.526529	0.00	0.00	0.0000
7120ba73-9097-4b0d-9e51-6fd20cad47cb	3cad4145-712b-4bee-ba78-4eeffd65bbea	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.19	11726.92	307129.00	76.37	1999.98	0.651100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.535149	2026-01-12 04:10:52.535149	0.00	0.00	0.0000
452dbcf6-a8e3-46aa-9f53-1184ee0564e0	e176f6c5-a5ef-4f2c-8072-221d0bacacc9	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.15	4317.01	117208.20	130.44	3541.53	3.021500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.560908	2026-01-12 04:10:52.560908	0.00	0.00	0.0000
ea74c62b-7058-4119-bccd-db775141471c	e176f6c5-a5ef-4f2c-8072-221d0bacacc9	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10524.15	252478.27	551.20	13223.26	5.237300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.568155	2026-01-12 04:10:52.568155	0.00	0.00	0.0000
ce70a0a7-5cc3-45ad-808e-433292b060f7	e176f6c5-a5ef-4f2c-8072-221d0bacacc9	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.44	1838.09	50437.21	154.27	4233.15	8.392900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.576913	2026-01-12 04:10:52.576913	0.00	0.00	0.0000
ae81dd22-c7a0-4365-9d4c-5462bbdf20a0	e7ecda81-faab-4750-b244-0eff4690939d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2978.31	80382.40	160.65	4336.10	5.394300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.594141	2026-01-12 04:10:52.594141	0.00	0.00	0.0000
eb831828-473a-415b-b49c-943fd4464fbe	e7ecda81-faab-4750-b244-0eff4690939d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7661.11	183785.34	413.26	9914.15	5.394400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.601474	2026-01-12 04:10:52.601474	0.00	0.00	0.0000
4366a7f8-f3c0-4529-ae6a-49e52f8e7b35	e7ecda81-faab-4750-b244-0eff4690939d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.610194	2026-01-12 04:10:52.610194	0.00	0.00	0.0000
5c04a07f-beac-4b64-9f59-5fee18a08205	914e5c7f-9b0a-43f9-bfcd-b1371120b165	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	480.22	13105.17	14.27	389.42	2.971400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.636363	2026-01-12 04:10:52.636363	0.00	0.00	0.0000
ecc6683b-54c3-42db-9a5d-808de1fef887	914e5c7f-9b0a-43f9-bfcd-b1371120b165	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6199.79	148733.58	355.41	8526.06	5.732400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.643566	2026-01-12 04:10:52.643566	0.00	0.00	0.0000
6025d6ab-8fa3-4086-a7cb-64b3803e2dc8	914e5c7f-9b0a-43f9-bfcd-b1371120b165	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.09	6801.36	184248.79	20.30	550.02	0.298500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.651909	2026-01-12 04:10:52.651909	0.00	0.00	0.0000
2f7e4aa8-9883-495d-a35a-ef889e19a534	5d0731be-2474-4773-a0e0-d9877c95f204	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2147.82	57970.40	164.03	4427.33	7.637200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.669235	2026-01-12 04:10:52.669235	0.00	0.00	0.0000
e0356a19-2133-4230-a503-a51decd3053b	5d0731be-2474-4773-a0e0-d9877c95f204	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	5607.83	137335.84	521.38	12768.71	9.297400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.67656	2026-01-12 04:10:52.67656	0.00	0.00	0.0000
d1c86f17-8b66-44d9-9edb-dfb16fbba3ee	5d0731be-2474-4773-a0e0-d9877c95f204	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	2856.45	78124.12	132.73	3630.22	4.646700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.685001	2026-01-12 04:10:52.685001	0.00	0.00	0.0000
1769173e-36dc-4402-b7bc-90f179e08f2f	7581d5ca-0b94-499f-83e4-5edc739007e9	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.27	1171.23	31939.71	47.35	1291.19	4.042500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.710889	2026-01-12 04:10:52.710889	0.00	0.00	0.0000
c69a8c2d-fc1e-4559-aa86-b780f002a143	7581d5ca-0b94-499f-83e4-5edc739007e9	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8856.92	212481.13	265.81	6376.73	3.001000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.718403	2026-01-12 04:10:52.718403	0.00	0.00	0.0000
646ef952-2f7a-40ba-a9d0-5542cddc1abc	7581d5ca-0b94-499f-83e4-5edc739007e9	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.29	1853.28	50576.19	12.83	349.99	0.692000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.726934	2026-01-12 04:10:52.726934	0.00	0.00	0.0000
ce63de9e-dfcd-4e21-8ea4-826d2e3f333a	31e2f3f0-e7e3-42c5-8b4e-8f0bd7ca7610	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3707.86	100076.04	236.23	6375.95	6.371100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.752802	2026-01-12 04:10:52.752802	0.00	0.00	0.0000
3bd34831-6f78-49e0-97d8-d4db68e4aecc	31e2f3f0-e7e3-42c5-8b4e-8f0bd7ca7610	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8729.92	213796.88	494.78	12117.32	5.667600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.760097	2026-01-12 04:10:52.760097	0.00	0.00	0.0000
fe605956-b51c-4f20-a1dc-c8b17ab42529	31e2f3f0-e7e3-42c5-8b4e-8f0bd7ca7610	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.49	3923.92	107868.83	375.32	10317.44	9.564800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.768596	2026-01-12 04:10:52.768596	0.00	0.00	0.0000
7f2db348-39b2-4f24-8a55-e0b4493ee275	0ce86915-79ea-488e-ae1d-5c0d2494a9ea	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.89	689.37	17847.88	30.44	787.98	4.414900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.785987	2026-01-12 04:10:52.785987	0.00	0.00	0.0000
e220d11f-5bb9-45ca-8cea-c7e567a97b5d	0ce86915-79ea-488e-ae1d-5c0d2494a9ea	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4129.19	99060.27	215.60	5172.31	5.221300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.793518	2026-01-12 04:10:52.793518	0.00	0.00	0.0000
e897bc18-3698-439b-ba22-eb47cec45d8a	0ce86915-79ea-488e-ae1d-5c0d2494a9ea	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.97	12648.85	341140.07	76.19	2054.80	0.602300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.801819	2026-01-12 04:10:52.801819	0.00	0.00	0.0000
dc8d88cc-76fa-457d-8fdd-aa326b0045ba	a2c11128-f884-4dc2-a25c-e98659af59b7	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	1021.48	27570.13	33.58	906.31	3.287200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.819217	2026-01-12 04:10:52.819217	0.00	0.00	0.0000
97de855b-954a-4de5-b70b-c66ba0e0b794	a2c11128-f884-4dc2-a25c-e98659af59b7	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8203.96	196817.55	309.78	7431.49	3.775800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.826651	2026-01-12 04:10:52.826651	0.00	0.00	0.0000
28b45677-b87f-403f-92a8-f83476b172b9	a2c11128-f884-4dc2-a25c-e98659af59b7	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.835212	2026-01-12 04:10:52.835212	0.00	0.00	0.0000
8140f2e8-a17c-4455-a56d-23d28dc2faba	a98b60ce-4ad8-406c-9de9-294087b4f853	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	691.04	18858.75	25.11	685.18	3.633200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.852636	2026-01-12 04:10:52.852636	0.00	0.00	0.0000
d93a6bf1-725c-489f-8512-78c2e07a2d92	a98b60ce-4ad8-406c-9de9-294087b4f853	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5206.23	124899.61	175.76	4216.28	3.375700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.860277	2026-01-12 04:10:52.860277	0.00	0.00	0.0000
53749a15-53dd-499c-80e6-109f031170a7	a98b60ce-4ad8-406c-9de9-294087b4f853	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	679.20	18331.70	2.67	71.99	0.392700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.868681	2026-01-12 04:10:52.868681	0.00	0.00	0.0000
3ababe70-7480-4b39-b381-6f2de925b680	16cf3ac8-27a7-469a-bccc-171193565776	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.79	2339.32	62672.10	103.56	2774.30	4.426600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.88595	2026-01-12 04:10:52.88595	0.00	0.00	0.0000
f4b2f38c-ed2b-4a15-974a-785ae1893b23	16cf3ac8-27a7-469a-bccc-171193565776	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	7193.12	176161.16	266.83	6534.66	3.709400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.893232	2026-01-12 04:10:52.893232	0.00	0.00	0.0000
e25956d3-d288-488b-8f88-f454ef0a17d6	16cf3ac8-27a7-469a-bccc-171193565776	5673f079-eac8-4a64-b47c-ebcfcbb85c31	25.99	18925.95	491886.07	17.69	459.88	0.093400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.901615	2026-01-12 04:10:52.901615	0.00	0.00	0.0000
3b06b7f1-b70f-4434-967e-1277da289b3b	ab048870-3174-4755-a1ac-693d6f6a6c95	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	370.10	9863.10	30.56	814.38	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.919271	2026-01-12 04:10:52.919271	0.00	0.00	0.0000
c7e7f06e-f279-41ee-a2a1-3e89fcb97203	ab048870-3174-4755-a1ac-693d6f6a6c95	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3660.87	87825.08	140.80	3377.77	3.846000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.926879	2026-01-12 04:10:52.926879	0.00	0.00	0.0000
f60920cd-fdee-4287-b730-2d64a1f14971	ab048870-3174-4755-a1ac-693d6f6a6c95	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	6447.63	174021.93	5.56	149.94	0.086100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.93541	2026-01-12 04:10:52.93541	0.00	0.00	0.0000
cbcce42d-e6e6-4019-8369-b58eaa4d003e	da66b826-e89e-47ef-998a-fb8e7ce8dcdf	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.47	357.73	9469.04	9.76	258.42	2.729100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.952488	2026-01-12 04:10:52.952488	0.00	0.00	0.0000
dbcd4bcd-3f6f-4928-a180-3acc89d3be0a	da66b826-e89e-47ef-998a-fb8e7ce8dcdf	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2108.92	50593.87	35.13	842.77	1.665700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.960229	2026-01-12 04:10:52.960229	0.00	0.00	0.0000
90cd23ca-764a-49c2-8ef2-e2fff9ca8270	da66b826-e89e-47ef-998a-fb8e7ce8dcdf	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	13808.54	372693.36	16.67	449.94	0.120700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.968612	2026-01-12 04:10:52.968612	0.00	0.00	0.0000
2e393b60-9a00-4b89-a876-8df738fb8d80	9a831a1e-fb63-462c-9d66-0aeeeb9206f3	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	4357.03	118598.31	383.46	10437.86	8.801000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.985988	2026-01-12 04:10:52.985988	0.00	0.00	0.0000
dd762b54-d162-43ff-8ee3-d65bee9ba7f9	9a831a1e-fb63-462c-9d66-0aeeeb9206f3	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	21955.13	526708.45	854.33	20495.30	3.891200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:52.993289	2026-01-12 04:10:52.993289	0.00	0.00	0.0000
092fbf65-cdd4-40b6-bd4e-51b5dad3160f	9a831a1e-fb63-462c-9d66-0aeeeb9206f3	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	14906.48	405009.37	11.04	299.97	0.074000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.001962	2026-01-12 04:10:53.001962	0.00	0.00	0.0000
551aee18-9779-4a39-8a89-41578a81601b	4ee5fab7-e692-4b4f-ba9a-7bf1162a1e1b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	479.33	13081.01	23.94	653.27	4.994000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.020491	2026-01-12 04:10:53.020491	0.00	0.00	0.0000
00ec1003-bb3b-4dbe-bd81-4eac358b9afc	4ee5fab7-e692-4b4f-ba9a-7bf1162a1e1b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4119.33	98823.67	195.74	4695.70	4.751500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.027035	2026-01-12 04:10:53.027035	0.00	0.00	0.0000
8d64d848-cead-4ab8-a46a-d781e824c329	4ee5fab7-e692-4b4f-ba9a-7bf1162a1e1b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.035437	2026-01-12 04:10:53.035437	0.00	0.00	0.0000
92e5f9ed-b662-4e20-9b54-aa4770056c5f	628ec9f0-1089-4ae7-994c-7e14b044a9a4	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.09	3154.34	85451.66	119.65	3241.32	3.793100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.052768	2026-01-12 04:10:53.052768	0.00	0.00	0.0000
efbbc981-4b8a-434f-bfc4-f94588fe0550	628ec9f0-1089-4ae7-994c-7e14b044a9a4	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7810.02	187364.79	350.81	8415.79	4.491600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.060161	2026-01-12 04:10:53.060161	0.00	0.00	0.0000
12b6b6f6-f35f-43f3-8011-ba604fc046bf	628ec9f0-1089-4ae7-994c-7e14b044a9a4	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.068346	2026-01-12 04:10:53.068346	0.00	0.00	0.0000
5acacc95-959d-46e0-a8cc-74c2b5e2e06e	469f9cb8-22d5-487b-b865-fc9a8e3d4b63	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.086004	2026-01-12 04:10:53.086004	0.00	0.00	0.0000
ce5760ed-f0ac-4d41-a650-f40ebb304dd3	469f9cb8-22d5-487b-b865-fc9a8e3d4b63	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11700.68	280704.35	580.86	13934.71	4.964100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.093297	2026-01-12 04:10:53.093297	0.00	0.00	0.0000
30e97a56-ca3e-452b-b36b-7ac627b5713b	469f9cb8-22d5-487b-b865-fc9a8e3d4b63	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	2714.80	73761.12	119.39	3243.75	4.397600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.102047	2026-01-12 04:10:53.102047	0.00	0.00	0.0000
c6c6a6cb-d310-4371-9d12-dbc104c23c5b	b5be03dd-d9d7-499f-bd06-3dbfd2818e66	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.49	551.02	14045.54	45.50	1159.72	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.11933	2026-01-12 04:10:53.11933	0.00	0.00	0.0000
24bdec75-db34-4921-93c1-456cd8566f9a	b5be03dd-d9d7-499f-bd06-3dbfd2818e66	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2585.85	62035.44	178.11	4272.88	6.887800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.1268	2026-01-12 04:10:53.1268	0.00	0.00	0.0000
f3604821-7b18-44c9-8b18-1bbb59d685ff	b5be03dd-d9d7-499f-bd06-3dbfd2818e66	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	1995.31	53055.45	116.01	3084.59	5.813800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.135397	2026-01-12 04:10:53.135397	0.00	0.00	0.0000
30891c12-213f-43a2-8276-99c9c5348289	a839468c-9a60-4d42-8701-68624a57628d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	2221.81	59078.35	148.03	3936.06	6.662400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.1527	2026-01-12 04:10:53.1527	0.00	0.00	0.0000
69b95474-8fc6-469a-8f24-bffd41eb836a	a839468c-9a60-4d42-8701-68624a57628d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8119.23	194782.07	474.05	11372.40	5.838500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.159974	2026-01-12 04:10:53.159974	0.00	0.00	0.0000
c31a2295-cced-4e36-ba2b-2642df9884c2	a839468c-9a60-4d42-8701-68624a57628d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.67	3925.40	104690.76	65.81	1755.13	1.676400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.168628	2026-01-12 04:10:53.168628	0.00	0.00	0.0000
c9f6a25a-1263-48a0-a55d-b9569404761e	2847ae4b-bab8-43a4-9710-8975d835ff00	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	1335.31	36441.04	43.44	1185.56	3.253300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.18601	2026-01-12 04:10:53.18601	0.00	0.00	0.0000
3e7ce351-c42a-4fd8-973c-5341629cfef6	2847ae4b-bab8-43a4-9710-8975d835ff00	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8780.83	210656.70	168.71	4047.34	1.921200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.193654	2026-01-12 04:10:53.193654	0.00	0.00	0.0000
6661824b-c276-4b39-af2d-68276c17fe9f	2847ae4b-bab8-43a4-9710-8975d835ff00	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.202191	2026-01-12 04:10:53.202191	0.00	0.00	0.0000
b3612a99-7522-4d0d-a7c8-a689b4d4fa43	025c241b-edf6-4d8f-94b4-0563cef86cde	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	348.72	9293.49	15.76	419.96	4.518800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.21934	2026-01-12 04:10:53.21934	0.00	0.00	0.0000
9a48db46-507f-47b0-9540-cdf3308a0f9d	025c241b-edf6-4d8f-94b4-0563cef86cde	a8e9ece3-c380-495c-b76e-713d7e322e98	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.226758	2026-01-12 04:10:53.226758	0.00	0.00	0.0000
55f291ec-25de-4334-a610-26713add4e3c	025c241b-edf6-4d8f-94b4-0563cef86cde	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.235477	2026-01-12 04:10:53.235477	0.00	0.00	0.0000
a9bb5ec1-e33b-471b-8c51-3c21b2825b3a	53f05cf4-73bb-47a1-ba1a-48fea533a436	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	321.86	8654.95	7.44	200.01	2.310900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.261409	2026-01-12 04:10:53.261409	0.00	0.00	0.0000
113391e9-0c31-4205-9e2c-764ec7a23b52	53f05cf4-73bb-47a1-ba1a-48fea533a436	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2797.49	67113.68	161.77	3880.87	5.782500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.268928	2026-01-12 04:10:53.268928	0.00	0.00	0.0000
f9fbc85e-c446-4e45-a06f-0afd521f82ad	53f05cf4-73bb-47a1-ba1a-48fea533a436	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	4651.44	125542.62	46.32	1250.14	0.995700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.277131	2026-01-12 04:10:53.277131	0.00	0.00	0.0000
93d7e556-ee4a-4a44-b106-acde8dfbed55	433546b6-d201-4791-a346-aa0ddd99fdaa	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	729.19	19899.88	32.33	882.34	4.433800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.302846	2026-01-12 04:10:53.302846	0.00	0.00	0.0000
72de527e-05bd-461d-9156-ec5163b9d9ab	433546b6-d201-4791-a346-aa0ddd99fdaa	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3686.99	88452.37	170.35	4086.69	4.620200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.310408	2026-01-12 04:10:53.310408	0.00	0.00	0.0000
4c48583e-3f24-487a-b76e-45e158aa84c5	433546b6-d201-4791-a346-aa0ddd99fdaa	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	3591.10	96923.89	18.15	489.80	0.505300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.31867	2026-01-12 04:10:53.31867	0.00	0.00	0.0000
012fc245-63fd-4f10-8931-e5e6b73e8392	16a0b428-62d3-4587-a946-9a57abc9dbe4	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	583.35	15686.14	38.40	1032.62	6.583000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.336142	2026-01-12 04:10:53.336142	0.00	0.00	0.0000
1ba817a9-2a53-4139-81a8-3c4d013de0e3	16a0b428-62d3-4587-a946-9a57abc9dbe4	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2863.27	68690.77	67.56	1620.68	2.359300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.343434	2026-01-12 04:10:53.343434	0.00	0.00	0.0000
32ff1f5b-a8d0-4231-8a17-f8858982e0ba	16a0b428-62d3-4587-a946-9a57abc9dbe4	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	13747.75	371052.84	5.56	149.94	0.040400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.352256	2026-01-12 04:10:53.352256	0.00	0.00	0.0000
a3f097c8-b8b6-4033-8fac-0e3627610e5c	99b346a5-4720-4129-96dc-b84c442eb2b0	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	1347.55	36235.53	64.69	1739.41	4.800200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.37819	2026-01-12 04:10:53.37819	0.00	0.00	0.0000
8bd9ecd1-ae7e-449d-8a89-7912c68e8c81	99b346a5-4720-4129-96dc-b84c442eb2b0	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10184.25	244324.10	480.27	11521.50	4.715600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.385524	2026-01-12 04:10:53.385524	0.00	0.00	0.0000
f5d2ca5c-bf2b-4dbb-b4fb-949d1bf92a5f	99b346a5-4720-4129-96dc-b84c442eb2b0	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	776.17	20949.05	26.94	727.08	3.470700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.393528	2026-01-12 04:10:53.393528	0.00	0.00	0.0000
1bd380a6-8879-41fc-ae7e-a294b9a0de2f	244f47a1-e8aa-445a-a079-5336efcdcac9	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.411079	2026-01-12 04:10:53.411079	0.00	0.00	0.0000
0ba2d740-edbc-4f2b-9736-eff46735519d	244f47a1-e8aa-445a-a079-5336efcdcac9	a8e9ece3-c380-495c-b76e-713d7e322e98	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.418796	2026-01-12 04:10:53.418796	0.00	0.00	0.0000
a2e387d7-ddc2-4b2c-bd06-cb1984d844ab	244f47a1-e8aa-445a-a079-5336efcdcac9	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.27	3443.31	93899.09	138.79	3784.89	4.030800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.427151	2026-01-12 04:10:53.427151	0.00	0.00	0.0000
6feed293-a29e-4af3-8494-d8891c125b28	d15fe173-4b91-41d4-a357-addb45ef0355	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.50	2048.59	52239.67	122.80	3131.29	5.994000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.444459	2026-01-12 04:10:53.444459	0.00	0.00	0.0000
98071cb3-3b50-4326-87c3-c82d1ce96e1b	d15fe173-4b91-41d4-a357-addb45ef0355	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7110.64	170586.80	479.36	11499.72	6.741200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.452072	2026-01-12 04:10:53.452072	0.00	0.00	0.0000
c611c893-f13f-4d5b-ba4c-08f6ea0fea84	d15fe173-4b91-41d4-a357-addb45ef0355	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.80	4119.84	110411.86	18.93	507.21	0.459300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.460218	2026-01-12 04:10:53.460218	0.00	0.00	0.0000
65f3a4d2-855e-42e3-9e7e-74a93c2ce8fd	0ebf03cc-8db2-4bf3-9d37-36014cf10c6d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.10	575.21	15587.85	24.27	657.77	4.219700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.477835	2026-01-12 04:10:53.477835	0.00	0.00	0.0000
668f7bde-a9e2-4d46-83bf-e61f6964f9f4	0ebf03cc-8db2-4bf3-9d37-36014cf10c6d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4583.98	109966.63	155.43	3728.83	3.390800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.485118	2026-01-12 04:10:53.485118	0.00	0.00	0.0000
96b87e19-a3bc-493f-bdd7-7e76d7dddf93	0ebf03cc-8db2-4bf3-9d37-36014cf10c6d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.493499	2026-01-12 04:10:53.493499	0.00	0.00	0.0000
79decc3e-0204-4387-90d0-38eba1f6644b	1246b9a7-2f5d-4915-af21-03bbd8370bed	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.50	1559.02	39754.17	86.17	2197.41	5.527400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.511099	2026-01-12 04:10:53.511099	0.00	0.00	0.0000
9f66c00f-875a-4248-98be-9a662b7b8f13	1246b9a7-2f5d-4915-af21-03bbd8370bed	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6223.22	149290.31	404.85	9712.28	6.505600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.518466	2026-01-12 04:10:53.518466	0.00	0.00	0.0000
be13cf2c-09ea-4f30-9bc5-5eb9b084f9f2	1246b9a7-2f5d-4915-af21-03bbd8370bed	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.80	4043.14	108356.53	3.67	98.29	0.090700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.526834	2026-01-12 04:10:53.526834	0.00	0.00	0.0000
83cac887-a2af-4e39-aaad-e81a3ede4d74	a415251f-c88c-4d53-95ea-51674330e06d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	2668.13	72626.84	152.40	4148.29	5.711700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.552721	2026-01-12 04:10:53.552721	0.00	0.00	0.0000
674052a0-a70c-4334-b959-efcb97fa3b74	a415251f-c88c-4d53-95ea-51674330e06d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	15694.61	376517.71	815.19	19556.36	5.194000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.560054	2026-01-12 04:10:53.560054	0.00	0.00	0.0000
148ac8d1-fec7-447d-bab1-c8e6bab07f91	a415251f-c88c-4d53-95ea-51674330e06d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	53582.57	1455837.99	283.25	7695.91	0.528600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.568374	2026-01-12 04:10:53.568374	0.00	0.00	0.0000
7abe98da-b3d9-4edf-8526-8d06829bc037	8a7ee8b4-cef3-4380-ba15-ee8f99bec9dd	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	383.76	10473.26	12.80	349.31	3.335200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.585317	2026-01-12 04:10:53.585317	0.00	0.00	0.0000
3175c815-d527-4c8c-bd9a-f65754a3ab74	8a7ee8b4-cef3-4380-ba15-ee8f99bec9dd	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3483.86	83578.01	150.21	3603.41	4.311400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.593065	2026-01-12 04:10:53.593065	0.00	0.00	0.0000
61de85c8-8e00-4342-b0ab-bfbfeb50f054	8a7ee8b4-cef3-4380-ba15-ee8f99bec9dd	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.601517	2026-01-12 04:10:53.601517	0.00	0.00	0.0000
f0a1c885-e90e-4758-b893-3cb105796d22	ee22d8c9-9a17-4f0e-922c-d65235dd949b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.619398	2026-01-12 04:10:53.619398	0.00	0.00	0.0000
982407db-899a-414c-ab50-1aaa2885c4e4	ee22d8c9-9a17-4f0e-922c-d65235dd949b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5049.62	121143.88	92.13	2210.09	1.824300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.62687	2026-01-12 04:10:53.62687	0.00	0.00	0.0000
012789fb-bd23-4dfb-9ffd-6457217da8f3	ee22d8c9-9a17-4f0e-922c-d65235dd949b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.59	3429.61	94623.00	23.39	645.21	0.681800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.635385	2026-01-12 04:10:53.635385	0.00	0.00	0.0000
a8d1aadf-fcba-4fad-be9a-8244baf81daf	3e0b173f-2f11-4c4c-832d-f7c93bbc281f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	3956.55	107697.61	189.94	5170.21	4.800600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.661804	2026-01-12 04:10:53.661804	0.00	0.00	0.0000
87d89fff-b437-42a8-bee7-94ad9af51914	3e0b173f-2f11-4c4c-832d-f7c93bbc281f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	12788.80	306808.31	517.09	12404.85	4.043100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.668836	2026-01-12 04:10:53.668836	0.00	0.00	0.0000
ceed742e-0019-49ba-8a9f-aace398be753	3e0b173f-2f11-4c4c-832d-f7c93bbc281f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	2167.19	58882.49	103.13	2801.89	4.758400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.677225	2026-01-12 04:10:53.677225	0.00	0.00	0.0000
2728ec23-6135-45f5-a065-f2a19fc65ade	9dfa9326-f2e1-42af-a89c-ae104aa5a630	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.694598	2026-01-12 04:10:53.694598	0.00	0.00	0.0000
cda88cce-aef4-461a-a105-5ce7d17c6a83	9dfa9326-f2e1-42af-a89c-ae104aa5a630	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8900.44	217974.02	484.32	11861.20	5.441500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.70199	2026-01-12 04:10:53.70199	0.00	0.00	0.0000
f4599c3c-5c8a-45c7-9247-f04a1893f53b	9dfa9326-f2e1-42af-a89c-ae104aa5a630	5673f079-eac8-4a64-b47c-ebcfcbb85c31	25.99	7943.58	206453.79	37.31	969.71	0.469600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.710648	2026-01-12 04:10:53.710648	0.00	0.00	0.0000
02e2820a-42ce-443b-9407-bfb0dd92e870	9602eb8b-f1d4-47a9-ab00-087add37fc0d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	842.06	22651.74	24.14	649.39	2.866800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.736636	2026-01-12 04:10:53.736636	0.00	0.00	0.0000
015ebb17-9844-4d9c-83ee-1d3d9d9de548	9602eb8b-f1d4-47a9-ab00-087add37fc0d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3073.38	73731.40	96.69	2319.49	3.145800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.743925	2026-01-12 04:10:53.743925	0.00	0.00	0.0000
13153185-8a91-4e23-90ca-660975f21fb9	9602eb8b-f1d4-47a9-ab00-087add37fc0d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	1107.92	30124.44	5.52	150.01	0.497900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.752207	2026-01-12 04:10:53.752207	0.00	0.00	0.0000
978d92de-f1ed-4317-b477-d6142110b6f2	bff06bcb-22ec-4cc2-8878-f56eb559b536	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.29	129.95	3416.35	9.62	253.03	7.406400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.769479	2026-01-12 04:10:53.769479	0.00	0.00	0.0000
113eb555-c7da-4668-8c2d-980dfc58d785	bff06bcb-22ec-4cc2-8878-f56eb559b536	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4582.15	109925.36	218.20	5234.54	4.761900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.776982	2026-01-12 04:10:53.776982	0.00	0.00	0.0000
3c038460-f653-4db2-a6ac-1fc3c40ec5ae	bff06bcb-22ec-4cc2-8878-f56eb559b536	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	3635.41	96665.66	35.73	949.97	0.982700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.785725	2026-01-12 04:10:53.785725	0.00	0.00	0.0000
af2e5343-e1fe-4ab4-a43f-2d7813530a65	c07974c3-69e9-481a-bafd-9c0aec9d763b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3247.63	87654.06	212.46	5734.32	6.541900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.802916	2026-01-12 04:10:53.802916	0.00	0.00	0.0000
bb431641-50cb-4b51-914c-8670ea40d663	c07974c3-69e9-481a-bafd-9c0aec9d763b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7862.35	188619.18	582.41	13971.87	7.407400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.81067	2026-01-12 04:10:53.81067	0.00	0.00	0.0000
b4ec0e5a-2514-4efb-8659-7568713c3ce4	c07974c3-69e9-481a-bafd-9c0aec9d763b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	13976.84	371644.60	240.69	6399.97	1.722000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.818936	2026-01-12 04:10:53.818936	0.00	0.00	0.0000
87917f98-3b51-4424-a3de-b8aeaa6f8014	20f6a7b1-768c-4e47-b443-c518f56df240	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	2096.43	56372.79	88.64	2383.42	4.227900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.836204	2026-01-12 04:10:53.836204	0.00	0.00	0.0000
3a4d04a6-2341-42b8-910a-3c20fce9c2f5	20f6a7b1-768c-4e47-b443-c518f56df240	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	9540.96	228893.45	252.92	6067.48	2.650700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.843909	2026-01-12 04:10:53.843909	0.00	0.00	0.0000
575b738d-c607-4d01-a090-da01a15b4004	20f6a7b1-768c-4e47-b443-c518f56df240	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.852192	2026-01-12 04:10:53.852192	0.00	0.00	0.0000
459032d3-9f52-4203-b024-8c59eb8e0ed9	2f99162e-a3ac-4e00-949d-d32ed87a3910	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	231.46	6316.66	8.49	231.58	3.666100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.869551	2026-01-12 04:10:53.869551	0.00	0.00	0.0000
2e833a98-8273-48da-ad05-9ca0c5742388	2f99162e-a3ac-4e00-949d-d32ed87a3910	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	1827.06	43832.04	53.22	1276.63	2.912500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.876912	2026-01-12 04:10:53.876912	0.00	0.00	0.0000
5a8fbd57-1206-4c8b-a507-2282fde9ffd5	2f99162e-a3ac-4e00-949d-d32ed87a3910	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	3395.34	91640.24	90.40	2439.79	2.662300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.885555	2026-01-12 04:10:53.885555	0.00	0.00	0.0000
5d3376b2-66a6-4001-be71-ac758d2fb5bf	b869c88f-3b36-4ca0-817f-7722d4b67d41	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2492.40	67270.53	128.64	3472.09	5.161300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.902891	2026-01-12 04:10:53.902891	0.00	0.00	0.0000
121ca71b-bd2d-4c8d-870f-a84224bd584e	b869c88f-3b36-4ca0-817f-7722d4b67d41	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8253.55	202130.66	482.37	11813.31	5.844300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.910251	2026-01-12 04:10:53.910251	0.00	0.00	0.0000
ef83aacb-aeaf-4a70-9336-cde63bea8fa9	b869c88f-3b36-4ca0-817f-7722d4b67d41	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.49	1980.90	54454.99	65.10	1789.49	3.286100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.918976	2026-01-12 04:10:53.918976	0.00	0.00	0.0000
946b9b06-0060-403c-a3de-e4aa999247a7	ab36e577-ef93-47c4-a6f2-f7f31aa07836	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.92	1677.61	45160.14	114.78	3089.90	6.842000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.936247	2026-01-12 04:10:53.936247	0.00	0.00	0.0000
18a628d4-6ade-41bd-b618-97af7cc66219	ab36e577-ef93-47c4-a6f2-f7f31aa07836	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5926.26	142161.56	309.86	7433.47	5.228800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.944011	2026-01-12 04:10:53.944011	0.00	0.00	0.0000
c2a0c759-e91d-4f2c-869b-2f83b9c60d27	ab36e577-ef93-47c4-a6f2-f7f31aa07836	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.952304	2026-01-12 04:10:53.952304	0.00	0.00	0.0000
5b04767f-f80d-4887-abc9-823e7df542c1	11f7101d-771e-4b00-b5dc-279e5453f97e	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	2286.05	61495.02	106.28	2858.90	4.648900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.96966	2026-01-12 04:10:53.96966	0.00	0.00	0.0000
9906a379-2318-4b8f-9d25-255250a98fe1	11f7101d-771e-4b00-b5dc-279e5453f97e	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6760.18	162173.56	310.86	7457.38	4.598300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.976964	2026-01-12 04:10:53.976964	0.00	0.00	0.0000
6ff90800-0b13-44ba-a5e6-ce6e947bf107	11f7101d-771e-4b00-b5dc-279e5453f97e	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	3121.87	84883.52	52.18	1418.87	1.671500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:53.985328	2026-01-12 04:10:53.985328	0.00	0.00	0.0000
ec6a5519-8c4a-4cdb-bbff-7ee51d50543d	6bf4a0fb-71c8-4da4-84f9-56a3c3db359e	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	1781.63	48495.94	108.80	2961.56	6.106800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.002174	2026-01-12 04:10:54.002174	0.00	0.00	0.0000
5988a9a4-d475-4074-aec9-bacf138af0e2	6bf4a0fb-71c8-4da4-84f9-56a3c3db359e	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7186.47	172404.88	381.19	9144.55	5.304100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.010343	2026-01-12 04:10:54.010343	0.00	0.00	0.0000
2726de55-36d0-46c3-a834-7c0fd89f4611	e60466a3-1de2-45d7-91be-6ebfdee63868	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	13222.75	351593.63	123.21	3275.99	0.931700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.821211	2026-01-11 20:07:08.821211	0.00	0.00	0.0000
9f7577f0-9b9e-4d6c-977d-fe892fbd9dc7	1ad22d08-00c1-40b8-bdbf-ca3d351cb8a4	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	1560.26	41955.14	58.30	1567.77	3.736700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.838725	2026-01-11 20:07:08.838725	0.00	0.00	0.0000
7a35251d-b1f4-4d38-b8a2-f41381dae900	1ad22d08-00c1-40b8-bdbf-ca3d351cb8a4	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.85439	2026-01-11 20:07:08.85439	0.00	0.00	0.0000
bf0cee66-df09-49c8-a11e-94e2cab3118f	6bf4a0fb-71c8-4da4-84f9-56a3c3db359e	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	18829.74	511605.00	196.52	5339.38	1.043600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.019143	2026-01-12 04:10:54.019143	0.00	0.00	0.0000
6c768bc7-e79d-42f6-a4e4-2cb39b90693f	0cd8ee78-284c-4e85-b1f1-ddbd276fc033	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.88	1746.46	45198.15	137.60	3561.03	7.878700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.036211	2026-01-12 04:10:54.036211	0.00	0.00	0.0000
739bea63-de23-4bd3-8e48-3b33e242403e	0cd8ee78-284c-4e85-b1f1-ddbd276fc033	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6923.87	166103.15	324.00	7772.61	4.679300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.043981	2026-01-12 04:10:54.043981	0.00	0.00	0.0000
20e9acf6-7c67-427f-9332-21e85ec8b05e	0cd8ee78-284c-4e85-b1f1-ddbd276fc033	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.70	23912.07	638452.54	59.93	1600.04	0.250600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.052374	2026-01-12 04:10:54.052374	0.00	0.00	0.0000
b9125803-225b-4bca-8ce6-49c343761c2d	9e0dc4b3-3f05-4551-9aa0-fb20a376238e	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.35	5849.17	148275.48	482.97	12243.01	8.256900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.069625	2026-01-12 04:10:54.069625	0.00	0.00	0.0000
b73a659e-e736-45f1-a762-150718314ceb	9e0dc4b3-3f05-4551-9aa0-fb20a376238e	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11419.88	273966.63	942.95	22621.07	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.077312	2026-01-12 04:10:54.077312	0.00	0.00	0.0000
ed38bd74-c8fb-47ee-a005-a94205ae9800	9e0dc4b3-3f05-4551-9aa0-fb20a376238e	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 04:10:54.085789	2026-01-12 04:10:54.085789	0.00	0.00	0.0000
5fcca302-35ef-4cd7-a94b-9d1e7943b232	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	3918.07	105396.08	242.46	6522.26	6.188100	8588.00	0.00	0.00	0.00	0.00	0.00	4669.93	4912.00	2026-01-12 04:12:31.665313	2026-01-12 04:12:31.665313	242.07	6511.68	6.1783
969b3271-9fa3-4957-ac30-b3afdf1373ed	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	12109.01	290495.15	687.23	16486.59	5.675200	33016.00	0.00	0.00	0.00	0.00	0.00	20906.99	21593.00	2026-01-12 04:12:31.673842	2026-01-12 04:12:31.673842	686.01	16457.38	5.6653
9cb8279d-b1ce-41d1-9bea-0bea2acb59ef	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	2805.90	76292.42	66.18	1799.48	2.358600	39882.00	0.00	0.00	0.00	0.00	0.00	37076.10	37142.00	2026-01-12 04:12:31.682626	2026-01-12 04:12:31.682626	65.90	1791.82	2.3486
9be18c8d-115b-4b89-958b-ac1dcdb4c9ac	f4c64294-6b23-438b-94df-a9f15c2e68f2	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	1307.91	35169.57	45.95	1235.49	3.512900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.580684	2026-01-11 20:07:06.580684	0.00	0.00	0.0000
b9c1340b-e584-4a7c-8271-70f13cd0eb2d	f4c64294-6b23-438b-94df-a9f15c2e68f2	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4607.25	110529.70	117.39	2816.14	2.547800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.586858	2026-01-11 20:07:06.586858	0.00	0.00	0.0000
51164748-eea3-4817-b7aa-fdd6cd90d820	f4c64294-6b23-438b-94df-a9f15c2e68f2	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	2240.02	60458.31	19.38	523.00	0.865000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.595183	2026-01-11 20:07:06.595183	0.00	0.00	0.0000
8536bd0e-791a-4a03-89c4-d8ee84bcb5d9	da9d115e-3bda-4009-bc9d-a102d8080407	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.67	1186.73	31650.26	85.77	2287.43	7.227200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.612049	2026-01-11 20:07:06.612049	0.00	0.00	0.0000
4fe358ec-0606-4767-8869-5a136e3b310f	da9d115e-3bda-4009-bc9d-a102d8080407	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	9089.36	222600.40	672.62	16472.75	7.400100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.620485	2026-01-11 20:07:06.620485	0.00	0.00	0.0000
f7915524-9243-4116-a029-6a8e2821abd1	da9d115e-3bda-4009-bc9d-a102d8080407	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.37	6435.17	169695.77	124.52	3283.50	1.934900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.628904	2026-01-11 20:07:06.628904	0.00	0.00	0.0000
773f0f01-694a-4c76-bac7-b7b08a27cf2e	d2b89476-9d69-4697-a0f3-a1f8d2fd7bca	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.39	1088.92	28736.67	39.95	1054.23	3.668500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.645952	2026-01-11 20:07:06.645952	0.00	0.00	0.0000
0a83fca5-836a-4e23-a765-55cc67f96798	d2b89476-9d69-4697-a0f3-a1f8d2fd7bca	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8312.94	199431.40	341.19	8185.03	4.104100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.653813	2026-01-11 20:07:06.653813	0.00	0.00	0.0000
6b697349-17ae-4aa3-8bb6-ff9bb174abe5	d2b89476-9d69-4697-a0f3-a1f8d2fd7bca	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	1443.73	38966.49	16.77	452.65	1.161600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.662209	2026-01-11 20:07:06.662209	0.00	0.00	0.0000
805fd2bb-2b92-4307-968d-eae879b948d2	c26ea08d-2fdc-4503-89ec-eea6eec6171e	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	1151.11	30953.36	46.07	1238.88	4.002400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.889551	2026-01-12 03:25:54.889551	0.00	0.00	0.0000
b6b29f32-e40a-4e08-838c-f2aaacdff741	c26ea08d-2fdc-4503-89ec-eea6eec6171e	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2766.22	66362.82	62.13	1490.55	2.246000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.897701	2026-01-12 03:25:54.897701	0.00	0.00	0.0000
c0e314b0-4f8c-48c0-b358-92e0a5773375	c26ea08d-2fdc-4503-89ec-eea6eec6171e	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.905772	2026-01-12 03:25:54.905772	0.00	0.00	0.0000
10465ab2-b36d-477b-9eb6-ce240bdbcad0	73c86f61-cbee-4db9-8c4d-6f616e3cb81c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.09	3084.96	80488.41	84.05	2192.92	2.724500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.712267	2026-01-11 20:07:06.712267	0.00	0.00	0.0000
0beb0491-1358-436a-86cf-d0524c813157	73c86f61-cbee-4db9-8c4d-6f616e3cb81c	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7896.93	189450.01	230.02	5518.02	2.912600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.72005	2026-01-11 20:07:06.72005	0.00	0.00	0.0000
4242b3fb-2309-47a9-84b9-ea1fd6b6c094	73c86f61-cbee-4db9-8c4d-6f616e3cb81c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	1627.96	43938.75	19.01	512.94	1.167300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.728689	2026-01-11 20:07:06.728689	0.00	0.00	0.0000
0681fe79-1509-4e46-88a4-f484e40d6ac2	5cd7623d-0433-429b-86d4-75d91502931d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	2236.44	59467.46	94.50	2512.83	4.225500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.746638	2026-01-11 20:07:06.746638	0.00	0.00	0.0000
7cad5dea-d227-4e53-a1cf-7fabdc78b2c4	5cd7623d-0433-429b-86d4-75d91502931d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7726.83	185370.33	271.06	6502.71	3.507900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.753866	2026-01-11 20:07:06.753866	0.00	0.00	0.0000
11367134-3f8c-44c8-8f83-270479e5eb60	5cd7623d-0433-429b-86d4-75d91502931d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.67	2153.76	57441.16	1.88	50.01	0.087000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.76228	2026-01-11 20:07:06.76228	0.00	0.00	0.0000
cabac952-18cc-4e3c-993f-67bb6b859040	4d06564a-9901-43bb-90c3-c128358bf99a	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.49	1057.76	28019.98	50.79	1345.35	4.801300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.7883	2026-01-11 20:07:06.7883	0.00	0.00	0.0000
400d4409-5b45-4dfe-ba0b-7077441d2ddc	4d06564a-9901-43bb-90c3-c128358bf99a	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4293.45	103001.56	197.59	4740.04	4.601900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.795701	2026-01-11 20:07:06.795701	0.00	0.00	0.0000
fee2634e-2e88-4c52-8873-1dc7efc22235	4d06564a-9901-43bb-90c3-c128358bf99a	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	2802.25	75632.73	67.59	1824.37	2.412100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.803939	2026-01-11 20:07:06.803939	0.00	0.00	0.0000
7b4c6cb0-8939-49fc-843d-de02cc3873a8	b57ad658-f1a4-419b-b7d7-23c0dc4609c2	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	877.92	23344.10	40.95	1088.83	4.664200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.82158	2026-01-11 20:07:06.82158	0.00	0.00	0.0000
f0f4bbed-5c67-4bc9-bed3-ae9a7e2b79d9	b57ad658-f1a4-419b-b7d7-23c0dc4609c2	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7586.86	182010.59	352.09	8446.61	4.640700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.828923	2026-01-11 20:07:06.828923	0.00	0.00	0.0000
255e9975-507c-4b11-ac58-49ed35ca5d42	b57ad658-f1a4-419b-b7d7-23c0dc4609c2	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.69	5081.82	135633.86	134.97	3602.33	2.655900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.837173	2026-01-11 20:07:06.837173	0.00	0.00	0.0000
7643d219-0c99-4632-80a6-ba7049af7947	965aa11a-7ab1-4c18-9085-5bc53b3fd1c9	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	499.95	13323.74	22.96	611.95	4.592900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.854922	2026-01-11 20:07:06.854922	0.00	0.00	0.0000
19943aa6-f1af-4b21-9118-8765b0ea5577	965aa11a-7ab1-4c18-9085-5bc53b3fd1c9	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3422.84	82115.47	125.95	3021.42	3.679400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.862159	2026-01-11 20:07:06.862159	0.00	0.00	0.0000
80dc28d9-5b67-4c90-a1d9-db18cb1ac183	965aa11a-7ab1-4c18-9085-5bc53b3fd1c9	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	1645.86	44421.93	41.82	1128.72	2.540900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.870774	2026-01-11 20:07:06.870774	0.00	0.00	0.0000
7cab5570-c807-4e65-9247-98b9c0a9322e	4d298c09-f5c8-44be-8882-edccd277b629	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	2359.87	64235.68	119.94	3264.74	5.082400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.888299	2026-01-11 20:07:06.888299	0.00	0.00	0.0000
897b3c08-6c02-4591-9806-fad9ab5c27a8	4d298c09-f5c8-44be-8882-edccd277b629	a8e9ece3-c380-495c-b76e-713d7e322e98	23.98	6180.49	148210.41	237.67	5699.38	3.845400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.895633	2026-01-11 20:07:06.895633	0.00	0.00	0.0000
8dc617d3-b938-49f6-8008-43198b8b79de	4d298c09-f5c8-44be-8882-edccd277b629	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	23040.42	626008.15	96.12	2611.47	0.417100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.903953	2026-01-11 20:07:06.903953	0.00	0.00	0.0000
09dd6190-f3e8-46ff-8419-59124fa4c290	df3390b7-d839-410d-b1b7-9acc39a0b4ed	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.49	1641.91	43494.50	78.96	2091.73	4.809100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.921505	2026-01-11 20:07:06.921505	0.00	0.00	0.0000
d97c285d-de84-44f1-b721-0ce26f53778e	df3390b7-d839-410d-b1b7-9acc39a0b4ed	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4147.31	99496.50	176.43	4232.59	4.254000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.928949	2026-01-11 20:07:06.928949	0.00	0.00	0.0000
4fcbd8fe-8237-4d54-9996-cfd462d7314b	df3390b7-d839-410d-b1b7-9acc39a0b4ed	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	221.85	6067.69	29.94	818.79	13.494200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.937292	2026-01-11 20:07:06.937292	0.00	0.00	0.0000
5504d486-719d-4208-a6ff-3e23eb6211de	32804d75-386f-4656-bcb1-af3ab5cd8e56	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	2280.33	60631.91	115.40	3068.51	5.060800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.962935	2026-01-11 20:07:06.962935	0.00	0.00	0.0000
d5e350d9-3407-433c-824a-08529a807e04	32804d75-386f-4656-bcb1-af3ab5cd8e56	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5997.99	143880.04	259.17	6217.53	4.321300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.97057	2026-01-11 20:07:06.97057	0.00	0.00	0.0000
14076040-0747-47e6-bb22-2b9cd659650e	32804d75-386f-4656-bcb1-af3ab5cd8e56	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	770.17	21063.82	17.19	470.15	2.232000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.979059	2026-01-11 20:07:06.979059	0.00	0.00	0.0000
c19d6f4a-d466-4920-bda3-3244dff61638	c42418b5-5c4c-455b-aaa6-789b21b1aefa	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.70	678.95	18127.89	13.11	350.09	1.931200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.056749	2026-01-12 03:25:58.056749	0.00	0.00	0.0000
80006837-cab6-48a4-b936-f0f59be67bb8	3c825894-bbf7-46c1-b285-20721b85f3a6	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.35	4342.22	110074.39	407.62	10332.94	9.387200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.081757	2026-01-12 03:25:58.081757	0.00	0.00	0.0000
1c19d7c3-4d7e-43ab-98ac-bd2e8437cea0	d93f9fde-8985-4108-9b85-3a2200fab7f6	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	1323.03	35705.78	80.07	2161.02	6.052200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:06.996649	2026-01-11 20:07:06.996649	0.00	0.00	0.0000
b1dcdd88-4a2f-4be9-933a-aa9908431e06	d93f9fde-8985-4108-9b85-3a2200fab7f6	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6010.27	144173.64	298.46	7159.97	4.966200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.004002	2026-01-11 20:07:07.004002	0.00	0.00	0.0000
0a77b0a6-bde9-463b-b8c5-4598851c31d8	d93f9fde-8985-4108-9b85-3a2200fab7f6	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.79	1777.10	47608.18	44.16	1182.93	2.484700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.01247	2026-01-11 20:07:07.01247	0.00	0.00	0.0000
aac231b1-187f-47eb-8fc9-4fe2175e3fd3	f3e86034-1259-4ccf-872d-54e36ab29131	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	2294.11	61228.98	120.18	3207.60	5.238600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.030034	2026-01-11 20:07:07.030034	0.00	0.00	0.0000
cb87df1d-46db-4b81-ac00-2520835ad613	f3e86034-1259-4ccf-872d-54e36ab29131	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7336.76	176005.26	348.98	8372.00	4.756600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.037225	2026-01-11 20:07:07.037225	0.00	0.00	0.0000
4c3d72b1-50e6-426e-9b36-2f7a07926ace	f3e86034-1259-4ccf-872d-54e36ab29131	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	3088.68	83363.51	287.34	7755.37	9.303000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.045593	2026-01-11 20:07:07.045593	0.00	0.00	0.0000
3b607a7b-e9b7-43f2-b3d1-f044c6c78699	49c902e2-32d9-49d6-8b1e-e23a4cf9c35b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	6977.14	188314.82	371.34	10022.60	5.322200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.063506	2026-01-11 20:07:07.063506	0.00	0.00	0.0000
9f9ce8ff-90fa-48b7-9609-452277fa1f49	49c902e2-32d9-49d6-8b1e-e23a4cf9c35b	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	15395.03	377025.98	592.47	14509.84	3.848400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.069817	2026-01-11 20:07:07.069817	0.00	0.00	0.0000
f8bc1ad5-9547-40eb-8fb6-88547106bfdd	49c902e2-32d9-49d6-8b1e-e23a4cf9c35b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.89	14336.97	385521.30	125.66	3378.87	0.876400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.078396	2026-01-11 20:07:07.078396	0.00	0.00	0.0000
eb807ea7-f312-4fe5-b016-a286434c3fce	02c68d58-2dca-421a-8c89-8c06f5107565	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.74	728.95	19492.05	43.97	1175.80	6.032200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.095787	2026-01-11 20:07:07.095787	0.00	0.00	0.0000
8b4bdf9c-7b38-4a20-b293-025ce90bf2f7	02c68d58-2dca-421a-8c89-8c06f5107565	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2356.64	56537.32	136.71	3279.67	5.800800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.10352	2026-01-11 20:07:07.10352	0.00	0.00	0.0000
c5c382f9-f15e-44d8-b532-4d0a51f38ffe	02c68d58-2dca-421a-8c89-8c06f5107565	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.19	5232.76	137046.40	46.18	1209.46	0.882500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.112029	2026-01-11 20:07:07.112029	0.00	0.00	0.0000
ff72d151-dedb-4e53-96aa-dd113933ac48	c82240a4-d93e-43f4-a756-b43abc2799dc	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	1618.41	43196.12	77.07	2056.94	4.761800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.130082	2026-01-11 20:07:07.130082	0.00	0.00	0.0000
34a402dd-658c-46b2-9f65-e6f1dfc349f7	b29b5077-bf66-450e-8097-e231178617dc	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.67	7997.05	213280.52	447.41	11932.44	5.594700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.930422	2026-01-12 03:25:54.930422	0.00	0.00	0.0000
4ce7fb5b-a8f4-47fc-8dde-bad8b9e74c25	c82240a4-d93e-43f4-a756-b43abc2799dc	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	9538.62	228835.51	366.88	8801.44	3.846100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.13731	2026-01-11 20:07:07.13731	0.00	0.00	0.0000
e09e91a2-76d7-4c74-b518-2cd5781d7726	c82240a4-d93e-43f4-a756-b43abc2799dc	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.84	1823.46	48941.63	70.13	1882.38	3.846100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.145552	2026-01-11 20:07:07.145552	0.00	0.00	0.0000
a2db5370-fddf-4364-bb87-e2fb88781e3d	2f7207ce-745e-439f-bc1d-11b46fd124e0	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	2942.69	79160.13	130.78	3518.00	4.444100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.163431	2026-01-11 20:07:07.163431	0.00	0.00	0.0000
4d003840-1e18-44fd-b1be-b0ac4aaa237a	2f7207ce-745e-439f-bc1d-11b46fd124e0	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6324.33	151723.74	279.52	6705.62	4.419600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.170654	2026-01-11 20:07:07.170654	0.00	0.00	0.0000
eb91dedf-1e56-4d3d-ace7-9ba457c166b1	2f7207ce-745e-439f-bc1d-11b46fd124e0	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	313.11	8513.43	24.26	659.69	7.748800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.178959	2026-01-11 20:07:07.178959	0.00	0.00	0.0000
fef33cb6-e995-42cc-bb03-a8b8ea874f8a	3aef4e67-5e45-4c9b-b536-d420a7683766	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.95	1835.97	49479.19	129.03	3477.26	7.027700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.196671	2026-01-11 20:07:07.196671	0.00	0.00	0.0000
99f65587-4760-46cf-b840-4041b37f8add	3aef4e67-5e45-4c9b-b536-d420a7683766	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3845.40	92250.29	250.52	6009.93	6.514800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.204027	2026-01-11 20:07:07.204027	0.00	0.00	0.0000
f6a348e9-01b5-46a4-aff8-9da8bb7d59dc	3aef4e67-5e45-4c9b-b536-d420a7683766	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.24	2137.22	58217.59	86.29	2350.42	4.037300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.212527	2026-01-11 20:07:07.212527	0.00	0.00	0.0000
6eef152d-33c1-4506-a4b9-eaf3d6c14cf5	4d468d1e-86a2-4c2a-8d69-fa0de598e39f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.95	2194.39	59136.18	143.46	3866.28	6.537900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.230234	2026-01-11 20:07:07.230234	0.00	0.00	0.0000
04c43a54-3737-49a4-afae-4de029eaebbc	4d468d1e-86a2-4c2a-8d69-fa0de598e39f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7444.96	178591.76	405.19	9720.43	5.442800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.237267	2026-01-11 20:07:07.237267	0.00	0.00	0.0000
ec303b01-7812-4ca8-8031-51d739077a8f	4d468d1e-86a2-4c2a-8d69-fa0de598e39f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.24	383.40	10443.57	8.41	229.04	2.193100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.245361	2026-01-11 20:07:07.245361	0.00	0.00	0.0000
5b82d3be-a944-42ae-b261-3d48f7e94205	4d57c19a-37c2-4b18-b2c1-1926d925e768	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	4450.52	120122.01	367.48	9918.31	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.263098	2026-01-11 20:07:07.263098	0.00	0.00	0.0000
a57dfbf0-3764-49fc-aaf6-baead6ea1a7b	4d57c19a-37c2-4b18-b2c1-1926d925e768	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	15441.31	370444.07	874.06	20968.52	5.660300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.269982	2026-01-11 20:07:07.269982	0.00	0.00	0.0000
8a18fba0-ce15-4ba5-9b3f-41b3eee98f59	4d57c19a-37c2-4b18-b2c1-1926d925e768	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.79	7397.22	198171.81	284.51	7621.99	3.846100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.278193	2026-01-11 20:07:07.278193	0.00	0.00	0.0000
601cc5f7-8730-4a77-961b-e2d65e47fc4a	018dad9e-70f2-4054-9c14-66be0cc906fc	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.295282	2026-01-11 20:07:07.295282	0.00	0.00	0.0000
269080ab-e34c-4394-8e09-be5cd1de5402	018dad9e-70f2-4054-9c14-66be0cc906fc	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	15491.32	371610.48	768.80	18443.38	4.963000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.303344	2026-01-11 20:07:07.303344	0.00	0.00	0.0000
1c4ccc0e-287c-4d4b-a10b-87566290f813	018dad9e-70f2-4054-9c14-66be0cc906fc	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.64	4723.36	125829.98	428.85	11424.69	9.079400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.311713	2026-01-11 20:07:07.311713	0.00	0.00	0.0000
8ce14289-703c-43ba-bc20-d3bb7be69ad7	23c2375c-0e0f-47af-bcca-f3425aba1436	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2703.39	72965.49	117.47	3170.43	4.345100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.329548	2026-01-11 20:07:07.329548	0.00	0.00	0.0000
35ab141a-ff0c-4072-8cae-1618a7f6ab4a	23c2375c-0e0f-47af-bcca-f3425aba1436	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	5245.13	128455.10	433.08	10606.26	8.256700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.337394	2026-01-11 20:07:07.337394	0.00	0.00	0.0000
3ae6555f-4c6d-4cf0-b77c-e380c223d833	23c2375c-0e0f-47af-bcca-f3425aba1436	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	359.23	9824.93	29.66	811.23	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.345651	2026-01-11 20:07:07.345651	0.00	0.00	0.0000
0175e8d5-e440-4611-b011-4626f0240651	e309da19-4062-4b8b-bd0a-c43d99a71258	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.09	2528.99	68510.32	208.82	5656.82	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.363432	2026-01-11 20:07:07.363432	0.00	0.00	0.0000
0543b150-ce4c-4ad4-a027-72e7c4229ce1	e309da19-4062-4b8b-bd0a-c43d99a71258	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8731.77	209478.60	494.27	11857.37	5.660400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.37073	2026-01-11 20:07:07.37073	0.00	0.00	0.0000
b4bef7c8-a9ba-4414-b3bc-77fae2c21976	e309da19-4062-4b8b-bd0a-c43d99a71258	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1600.08	43474.05	68.09	1850.01	4.255400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.379124	2026-01-11 20:07:07.379124	0.00	0.00	0.0000
3304dc10-2a9b-4b08-94a9-2af5095364cb	d9f4590c-6d9a-4183-9fa3-66758e234723	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3555.29	95958.51	196.40	5300.78	5.524000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.396682	2026-01-11 20:07:07.396682	0.00	0.00	0.0000
0e8ed865-3408-4220-a325-781cf5482676	d9f4590c-6d9a-4183-9fa3-66758e234723	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8734.86	213918.30	336.12	8231.69	3.848000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.404023	2026-01-11 20:07:07.404023	0.00	0.00	0.0000
8aa053e3-a72d-4b7c-9f6b-2796d8ef3783	d9f4590c-6d9a-4183-9fa3-66758e234723	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	3123.06	85416.16	121.15	3313.52	3.879200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.412372	2026-01-11 20:07:07.412372	0.00	0.00	0.0000
143ded0c-09f1-4400-a6a1-2cd5b611c060	d757f1b3-21ac-44d4-88b4-14da77974d6c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2380.50	64250.55	151.57	4090.87	6.367000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.431175	2026-01-11 20:07:07.431175	0.00	0.00	0.0000
7c130a70-21a3-4989-a105-5d2168a1980a	d757f1b3-21ac-44d4-88b4-14da77974d6c	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	6873.91	168343.14	276.11	6762.02	4.016800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.437373	2026-01-11 20:07:07.437373	0.00	0.00	0.0000
398ca7c1-d532-4b5f-acf2-4d68c71aeb0e	d757f1b3-21ac-44d4-88b4-14da77974d6c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	1881.09	51447.94	98.14	2684.23	5.217300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.445743	2026-01-11 20:07:07.445743	0.00	0.00	0.0000
4925fbfe-666b-477c-9601-29fadde00e23	d0e9c644-0453-4761-8491-28a4ae648950	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	4038.91	109939.43	225.03	6125.25	5.571400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.463511	2026-01-11 20:07:07.463511	0.00	0.00	0.0000
372dca2d-2792-446f-b255-a77994dde433	d0e9c644-0453-4761-8491-28a4ae648950	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	12949.29	310659.47	683.69	16401.55	5.279500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.470666	2026-01-11 20:07:07.470666	0.00	0.00	0.0000
ff8b109a-50da-4ea3-bd7b-88c0ed38e9f2	d0e9c644-0453-4761-8491-28a4ae648950	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1044.25	28372.57	30.28	822.80	2.899900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.479053	2026-01-11 20:07:07.479053	0.00	0.00	0.0000
c2d74b34-2c8a-40fa-b552-c07bb6ba07e9	998a61e3-6d58-4fb8-b388-71167311063a	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2934.83	79212.43	62.92	1698.16	2.143800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.496799	2026-01-11 20:07:07.496799	0.00	0.00	0.0000
3536f6d1-3d38-42e0-8877-1645f5f67c7d	998a61e3-6d58-4fb8-b388-71167311063a	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	13021.17	318892.09	448.31	10979.19	3.442900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.504116	2026-01-11 20:07:07.504116	0.00	0.00	0.0000
11fd47f7-ad09-4345-b9af-becda295cdff	998a61e3-6d58-4fb8-b388-71167311063a	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.34	694.33	18288.64	19.35	509.58	2.786300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.512472	2026-01-11 20:07:07.512472	0.00	0.00	0.0000
f61826cf-8efa-4a7a-a5e5-bfbf7122a963	1af3e72d-5660-4782-998c-3c67f3c2cece	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.529746	2026-01-11 20:07:07.529746	0.00	0.00	0.0000
0af5ef22-2eb0-4c38-ae73-be04efa05a17	1af3e72d-5660-4782-998c-3c67f3c2cece	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7243.04	173765.10	373.26	8954.50	5.153200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.536701	2026-01-11 20:07:07.536701	0.00	0.00	0.0000
53c89d50-6ae6-48cd-b147-68527ede006b	1af3e72d-5660-4782-998c-3c67f3c2cece	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	1526.78	41208.07	7.41	199.98	0.485200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.545328	2026-01-11 20:07:07.545328	0.00	0.00	0.0000
7982fd15-5586-458a-b91a-2cfba75a11b9	6b4e6e87-b9a0-439d-a35f-862aed10624d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	5092.11	135912.02	274.66	7330.55	5.393500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.562601	2026-01-11 20:07:07.562601	0.00	0.00	0.0000
ad46aba1-5690-4627-9b4d-ae4af1a18515	6b4e6e87-b9a0-439d-a35f-862aed10624d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	23957.92	574757.02	1895.65	45476.33	7.912200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.570426	2026-01-11 20:07:07.570426	0.00	0.00	0.0000
0a2210fa-be08-4be8-be03-971fb80f15a1	6b4e6e87-b9a0-439d-a35f-862aed10624d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.84	3923.85	105316.11	132.69	3561.38	3.381600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.579002	2026-01-11 20:07:07.579002	0.00	0.00	0.0000
e6e92288-6e09-46f1-bb23-68038f2371d8	6ae73016-7324-4791-8300-bd0ea229de4d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.75	6858.05	183448.38	316.26	8459.89	4.611500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.596852	2026-01-11 20:07:07.596852	0.00	0.00	0.0000
666730fc-a6c6-4d9a-9e78-8a69b685e85c	6ae73016-7324-4791-8300-bd0ea229de4d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11189.88	268434.46	494.22	11856.36	4.416800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.604133	2026-01-11 20:07:07.604133	0.00	0.00	0.0000
ccb29539-dabb-4109-b704-0e427aeafd8a	6ae73016-7324-4791-8300-bd0ea229de4d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.95	5629.43	151712.63	160.68	4330.15	2.854100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.612559	2026-01-11 20:07:07.612559	0.00	0.00	0.0000
bfbc10dd-39b0-4923-b061-6e5d0bc1f598	62531d50-d8b9-4d1c-b279-31343fb446b5	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.629749	2026-01-11 20:07:07.629749	0.00	0.00	0.0000
3cc70144-56c1-4bdb-ae01-c2438465c617	62531d50-d8b9-4d1c-b279-31343fb446b5	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	14160.45	346790.13	620.88	15205.45	4.384600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.637496	2026-01-11 20:07:07.637496	0.00	0.00	0.0000
2d191013-8553-4860-ae41-4c0836b36975	62531d50-d8b9-4d1c-b279-31343fb446b5	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.19	2935.77	76887.95	17.18	449.97	0.585200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.645967	2026-01-11 20:07:07.645967	0.00	0.00	0.0000
3855a0b5-4f65-4cc4-b499-7b1ce56b964b	cf53b89f-7a94-409b-8ab0-d1fa7691879b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.15	4101.30	111352.84	206.42	5604.44	5.033000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.663634	2026-01-11 20:07:07.663634	0.00	0.00	0.0000
6f355f4f-e9e3-4db9-844b-d7e451161a18	cf53b89f-7a94-409b-8ab0-d1fa7691879b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8277.88	198589.17	402.13	9647.07	4.857800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.670892	2026-01-11 20:07:07.670892	0.00	0.00	0.0000
757ea1cd-56bf-45a0-8568-7da95efc2397	cf53b89f-7a94-409b-8ab0-d1fa7691879b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.44	1423.75	39067.86	99.80	2738.44	7.009400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.67934	2026-01-11 20:07:07.67934	0.00	0.00	0.0000
503e1dce-72e5-456d-a92e-a864c6463243	737cf76e-b65c-43fb-85da-d4db085dc7cc	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3378.28	91179.17	181.03	4886.06	5.358700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.696808	2026-01-11 20:07:07.696808	0.00	0.00	0.0000
032a929c-4e64-4d76-af99-8486b6f87cf5	737cf76e-b65c-43fb-85da-d4db085dc7cc	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5855.51	140471.43	305.40	7326.58	5.215700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.704035	2026-01-11 20:07:07.704035	0.00	0.00	0.0000
974d7928-1125-4f42-9a83-72ee075f9fbc	737cf76e-b65c-43fb-85da-d4db085dc7cc	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.712199	2026-01-11 20:07:07.712199	0.00	0.00	0.0000
2b1efab4-5266-494f-aef0-deca007ef67c	22a4dbd8-aa0b-4f04-a0a8-3a07c89ddcd1	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	432.87	11812.99	34.41	939.01	7.948900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.730223	2026-01-11 20:07:07.730223	0.00	0.00	0.0000
0e15fcd1-82e3-4a6f-a24d-e7941f4fad12	22a4dbd8-aa0b-4f04-a0a8-3a07c89ddcd1	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3251.07	77993.97	163.16	3914.17	5.018500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.737558	2026-01-11 20:07:07.737558	0.00	0.00	0.0000
1f759b7d-dd88-45b3-9fc8-b6d16a59dae5	22a4dbd8-aa0b-4f04-a0a8-3a07c89ddcd1	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.09	6540.17	177173.12	42.68	1156.17	0.652500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.746029	2026-01-11 20:07:07.746029	0.00	0.00	0.0000
fc351657-a219-44e3-9952-07f994e83c33	eb077861-3689-4aad-a590-dde6a281ce0c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2440.12	65859.57	171.19	4620.47	7.015600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.763541	2026-01-11 20:07:07.763541	0.00	0.00	0.0000
90d04e4d-50a4-45c8-95e1-f4ad8588e994	eb077861-3689-4aad-a590-dde6a281ce0c	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	6258.62	153273.96	446.80	10942.28	7.139000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.770946	2026-01-11 20:07:07.770946	0.00	0.00	0.0000
f376fb39-a18f-4c54-951d-39cd79b609ef	eb077861-3689-4aad-a590-dde6a281ce0c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	2024.38	55366.93	90.44	2473.39	4.467200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.779381	2026-01-11 20:07:07.779381	0.00	0.00	0.0000
5b6c91ef-f0e3-4325-b155-8d43db084961	80eab7aa-4c78-4362-a698-f5d46192a371	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.27	1026.97	28005.64	35.00	954.42	3.407900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.79692	2026-01-11 20:07:07.79692	0.00	0.00	0.0000
50b671bd-54ee-4027-ab78-c6ee888950db	80eab7aa-4c78-4362-a698-f5d46192a371	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7567.36	181543.87	289.59	6947.14	3.826700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.804275	2026-01-11 20:07:07.804275	0.00	0.00	0.0000
01312640-9c01-481a-8216-55768914407c	80eab7aa-4c78-4362-a698-f5d46192a371	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.812558	2026-01-11 20:07:07.812558	0.00	0.00	0.0000
05f78ee7-2db3-4ab9-97f3-35f12dbab6da	b7419105-c188-4dce-9a0a-7e7e66a00cba	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	5525.11	149124.87	348.28	9400.02	6.303400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.830168	2026-01-11 20:07:07.830168	0.00	0.00	0.0000
77404cef-2a77-478a-8bc7-c2aecad85a3f	b7419105-c188-4dce-9a0a-7e7e66a00cba	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	6660.20	163109.05	316.40	7748.56	4.750500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.837494	2026-01-11 20:07:07.837494	0.00	0.00	0.0000
150d1aa3-141c-45fe-a1cc-f093b1583cf8	b7419105-c188-4dce-9a0a-7e7e66a00cba	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.49	2828.65	77759.65	158.18	4348.43	5.592100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.845879	2026-01-11 20:07:07.845879	0.00	0.00	0.0000
ab0df397-fe20-418d-a8f9-603bb0152350	64522954-bc5f-41f6-8987-00fe6a50ec7a	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.89	636.26	16473.00	31.28	809.85	4.916200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.86197	2026-01-11 20:07:07.86197	0.00	0.00	0.0000
f656103d-5bc5-476b-8331-82db76093eed	64522954-bc5f-41f6-8987-00fe6a50ec7a	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4098.82	98331.72	203.95	4892.67	4.975600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.870218	2026-01-11 20:07:07.870218	0.00	0.00	0.0000
0fd6746f-8506-498f-8c90-e6dad1f7c9c9	64522954-bc5f-41f6-8987-00fe6a50ec7a	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.97	10625.58	286571.71	77.87	2100.05	0.732800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.878452	2026-01-11 20:07:07.878452	0.00	0.00	0.0000
ca3b2cbc-f6cd-4f78-8e5f-509180ee34b1	3d0782db-68f7-4459-a644-a0b6237e4e89	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	1476.47	39850.50	52.51	1417.20	3.556200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.896016	2026-01-11 20:07:07.896016	0.00	0.00	0.0000
38713ca3-8530-4899-8083-9ac7f13e4dcc	3d0782db-68f7-4459-a644-a0b6237e4e89	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6654.69	159650.39	159.89	3835.66	2.402500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.90388	2026-01-11 20:07:07.90388	0.00	0.00	0.0000
b1fa519e-4234-4d0b-b119-2ef9379c9c90	3d0782db-68f7-4459-a644-a0b6237e4e89	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.912345	2026-01-11 20:07:07.912345	0.00	0.00	0.0000
da74301b-601f-4692-a54a-f56ec477913d	15d2ab92-5137-4759-b217-abcf95afd958	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	836.54	22829.72	30.57	834.22	3.654000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.930353	2026-01-11 20:07:07.930353	0.00	0.00	0.0000
31fbff73-8ef3-4fbd-92ff-7883e88132c2	15d2ab92-5137-4759-b217-abcf95afd958	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3741.24	89754.79	126.35	3031.10	3.377000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.93755	2026-01-11 20:07:07.93755	0.00	0.00	0.0000
278b3cb3-9981-4970-80d9-d56f02401d2c	15d2ab92-5137-4759-b217-abcf95afd958	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	518.49	13994.02	11.11	299.95	2.143400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.945979	2026-01-11 20:07:07.945979	0.00	0.00	0.0000
fd72c2c0-6929-4b5d-993e-d45c81eda421	8950563e-032b-4805-a5ab-e93388b3c160	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.79	4716.79	126366.92	201.94	5409.87	4.281000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.963543	2026-01-11 20:07:07.963543	0.00	0.00	0.0000
0fd058b0-7fc6-4ac1-b3af-066d8e6746f4	8950563e-032b-4805-a5ab-e93388b3c160	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	4385.67	107405.95	258.79	6337.94	5.900900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.970964	2026-01-11 20:07:07.970964	0.00	0.00	0.0000
a8fc6dae-aedd-4219-849a-52acbd4f40ed	8950563e-032b-4805-a5ab-e93388b3c160	5673f079-eac8-4a64-b47c-ebcfcbb85c31	25.99	22769.42	591777.37	178.80	4647.13	0.785200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.979497	2026-01-11 20:07:07.979497	0.00	0.00	0.0000
b18df79a-a98d-466a-8758-ae448262810f	b2ddb4f5-572b-43e2-9be2-56f61a923804	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	461.86	12308.44	38.14	1016.28	8.256700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:07.997298	2026-01-11 20:07:07.997298	0.00	0.00	0.0000
e47d9786-58ef-4c84-b116-24e2ff485470	b2ddb4f5-572b-43e2-9be2-56f61a923804	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3196.62	76688.25	122.95	2949.46	3.846000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.004312	2026-01-11 20:07:08.004312	0.00	0.00	0.0000
fc4df0e1-e70d-40cc-9d6b-7dd6ae9c456f	b2ddb4f5-572b-43e2-9be2-56f61a923804	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	4052.24	109370.13	5.56	149.94	0.137000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.01261	2026-01-11 20:07:08.01261	0.00	0.00	0.0000
c4cbd8cf-b52d-44d6-a3b6-e9e310e0674c	0c35f8f6-db20-46b9-b53e-1d0f9b73caa3	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.47	394.13	10432.54	24.18	639.95	6.134100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.030334	2026-01-11 20:07:08.030334	0.00	0.00	0.0000
1ef80a55-2bc4-474f-8c6c-ba3dd49be846	0c35f8f6-db20-46b9-b53e-1d0f9b73caa3	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2597.54	62316.63	102.62	2461.93	3.950600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.037567	2026-01-11 20:07:08.037567	0.00	0.00	0.0000
ccd82381-d62b-4664-a8e8-e4fcc4fa3303	0c35f8f6-db20-46b9-b53e-1d0f9b73caa3	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	10380.02	280156.96	253.61	6844.96	2.443200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.045982	2026-01-11 20:07:08.045982	0.00	0.00	0.0000
d6a2444d-cf92-4946-a77b-231448b7974f	4fcd471b-245a-4d94-b5fd-d749d4fd0ac8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	4852.68	132089.89	334.27	9098.84	6.888300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.063533	2026-01-11 20:07:08.063533	0.00	0.00	0.0000
e61fa530-d224-42d3-bbe1-2a19f2985c80	4fcd471b-245a-4d94-b5fd-d749d4fd0ac8	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	14748.13	353813.30	589.46	14141.02	3.996700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.070664	2026-01-11 20:07:08.070664	0.00	0.00	0.0000
beb82e03-9ff3-4c3f-a33a-b6f2614c7e22	4fcd471b-245a-4d94-b5fd-d749d4fd0ac8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	50698.09	1377467.46	3.68	99.98	0.007200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.079347	2026-01-11 20:07:08.079347	0.00	0.00	0.0000
447191bc-1801-442d-b0db-789b05044dcc	61578f67-e7e3-4b98-a814-b88311a686cc	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	448.71	12245.46	35.66	972.98	7.945600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.097017	2026-01-11 20:07:08.097017	0.00	0.00	0.0000
f2655060-fe49-475e-8f9c-93f5b6f8c198	61578f67-e7e3-4b98-a814-b88311a686cc	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3841.74	92164.25	166.85	4002.60	4.342800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.104335	2026-01-11 20:07:08.104335	0.00	0.00	0.0000
3b3e0dad-dd59-4aa9-ac53-43a2a8464032	61578f67-e7e3-4b98-a814-b88311a686cc	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.09	4016.89	108817.69	16.29	441.20	0.405400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.112642	2026-01-11 20:07:08.112642	0.00	0.00	0.0000
e9eec78c-ca33-4ebb-baea-bb9c7d536e9b	80817f6d-0c11-4031-9d56-5bb77cf9ef1d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.09	3211.62	87003.04	145.71	3947.34	4.537000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.130379	2026-01-11 20:07:08.130379	0.00	0.00	0.0000
1945724c-c6b7-45d3-905f-503d90ab82f3	80817f6d-0c11-4031-9d56-5bb77cf9ef1d	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7772.59	186467.43	372.83	8944.05	4.796500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.137612	2026-01-11 20:07:08.137612	0.00	0.00	0.0000
0fa0dd9b-605e-4dc4-864c-adb4efe1bab9	80817f6d-0c11-4031-9d56-5bb77cf9ef1d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	888.13	24130.73	2.16	58.63	0.242900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.146103	2026-01-11 20:07:08.146103	0.00	0.00	0.0000
24f30ae4-5438-4783-800f-b4dbc329dce0	d1366d81-0a4e-4dbc-8a78-b35ea819642c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.163539	2026-01-11 20:07:08.163539	0.00	0.00	0.0000
7487b232-e898-43c0-b032-4fd7ad285f3f	d1366d81-0a4e-4dbc-8a78-b35ea819642c	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11501.24	275918.41	628.59	15079.76	5.465200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.171068	2026-01-11 20:07:08.171068	0.00	0.00	0.0000
4d54b90a-487d-400d-a81d-994d48134987	d1366d81-0a4e-4dbc-8a78-b35ea819642c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1696.94	46105.87	197.58	5368.26	11.643300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.179395	2026-01-11 20:07:08.179395	0.00	0.00	0.0000
bd51b0c0-4aa3-4432-aca6-0c0e166b253d	f22a2d3b-ade6-455a-aaef-ba19875e66a8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.49	407.44	10385.90	40.45	1031.17	9.928500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.197111	2026-01-11 20:07:08.197111	0.00	0.00	0.0000
04de5fa1-a240-4a86-a9fa-8df1678626ed	f22a2d3b-ade6-455a-aaef-ba19875e66a8	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2313.09	55491.88	88.97	2134.32	3.846100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.2044	2026-01-11 20:07:08.2044	0.00	0.00	0.0000
1a678923-2423-437e-830d-41f4e4858331	f22a2d3b-ade6-455a-aaef-ba19875e66a8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	4138.73	110049.36	164.86	4383.45	3.983100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.212747	2026-01-11 20:07:08.212747	0.00	0.00	0.0000
54e3d092-913d-4114-941d-a657c57209a9	74c8553d-a932-4c4d-9477-fa886d16eb7b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	1435.67	38174.83	83.72	2225.97	5.830900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.230401	2026-01-11 20:07:08.230401	0.00	0.00	0.0000
5b8908b2-c2d9-4da7-8420-f01bfcd02347	74c8553d-a932-4c4d-9477-fa886d16eb7b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8101.51	194357.75	338.76	8126.82	4.181300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.237628	2026-01-11 20:07:08.237628	0.00	0.00	0.0000
5e8d7865-18de-4868-a393-3221db593962	74c8553d-a932-4c4d-9477-fa886d16eb7b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.67	2124.13	56650.98	41.17	1098.14	1.938400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.24598	2026-01-11 20:07:08.24598	0.00	0.00	0.0000
298cb18c-56b1-4424-aa36-1bcced433a12	2fb32cfc-c529-49c8-bc2a-7fecd4a8023e	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	1288.78	35171.37	55.82	1523.41	4.331300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.263544	2026-01-11 20:07:08.263544	0.00	0.00	0.0000
28c5cb07-b2be-4a86-b2b5-5feafb2bf1ae	2fb32cfc-c529-49c8-bc2a-7fecd4a8023e	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5935.85	142404.46	85.03	2039.82	1.432400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.271025	2026-01-11 20:07:08.271025	0.00	0.00	0.0000
bed2fe44-cdbb-482e-a1c4-e0011e7b62b0	2fb32cfc-c529-49c8-bc2a-7fecd4a8023e	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.279087	2026-01-11 20:07:08.279087	0.00	0.00	0.0000
91572aff-6eba-4ba9-9c0f-e548738d2256	f550cb1d-1540-457f-85c7-c20aab8a9647	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	657.07	17511.12	32.09	855.16	4.883500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.297046	2026-01-11 20:07:08.297046	0.00	0.00	0.0000
f892b7f8-7360-426c-b680-e5f581924653	f550cb1d-1540-457f-85c7-c20aab8a9647	a8e9ece3-c380-495c-b76e-713d7e322e98	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.304401	2026-01-11 20:07:08.304401	0.00	0.00	0.0000
860be314-adc6-4e59-8438-9782a0877100	f550cb1d-1540-457f-85c7-c20aab8a9647	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	805.40	21737.80	1.85	50.00	0.230000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.312628	2026-01-11 20:07:08.312628	0.00	0.00	0.0000
42608f8b-a0f3-4a33-aeb5-b027c8cbcbdb	d28ed581-f73d-440e-b1b3-4f3077797d75	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	416.05	11187.70	30.13	810.05	7.240500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.329255	2026-01-11 20:07:08.329255	0.00	0.00	0.0000
304969cf-9bbd-4b32-8c3d-7f83178f20f6	d28ed581-f73d-440e-b1b3-4f3077797d75	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3076.99	73817.90	171.08	4104.17	5.559800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.337107	2026-01-11 20:07:08.337107	0.00	0.00	0.0000
a837edb7-bf21-495c-b69e-008c25e4a7b2	d28ed581-f73d-440e-b1b3-4f3077797d75	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.345661	2026-01-11 20:07:08.345661	0.00	0.00	0.0000
71431ef1-b39f-443b-a424-8015512079d4	07d3ddcd-6e3d-4385-9f23-3d27ff711cc6	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	562.64	15354.56	20.65	563.65	3.670800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.362743	2026-01-11 20:07:08.362743	0.00	0.00	0.0000
a6b48271-c201-4676-a347-4df0d84793bd	07d3ddcd-6e3d-4385-9f23-3d27ff711cc6	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2847.10	68303.34	111.19	2667.32	3.905100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.370739	2026-01-11 20:07:08.370739	0.00	0.00	0.0000
746ac59c-a765-41e0-9265-68b43ba89f19	07d3ddcd-6e3d-4385-9f23-3d27ff711cc6	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	4020.99	108526.89	80.63	2176.26	2.005200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.379329	2026-01-11 20:07:08.379329	0.00	0.00	0.0000
aa4d5135-a196-4659-b474-db08fc3c2f55	8c978658-4d6c-44d4-b11d-595c5f482803	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	1223.54	32900.72	61.57	1655.67	5.032300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.396673	2026-01-11 20:07:08.396673	0.00	0.00	0.0000
d9c29bd2-bd8c-4dfe-925e-d33f8306088d	8c978658-4d6c-44d4-b11d-595c5f482803	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8057.62	193308.17	340.87	8177.31	4.230100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.404421	2026-01-11 20:07:08.404421	0.00	0.00	0.0000
7a7d681a-e774-4dcc-9b20-2dc32c68ab44	8c978658-4d6c-44d4-b11d-595c5f482803	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	2555.04	68960.90	123.70	3338.80	4.841500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.41276	2026-01-11 20:07:08.41276	0.00	0.00	0.0000
022c524b-3088-40c5-8f5b-342def37d3a8	f32af08b-7f85-4a14-88de-25ea9b8891a9	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.430465	2026-01-11 20:07:08.430465	0.00	0.00	0.0000
1e9aab01-0079-4fe0-821a-0ebfcdc6908c	f32af08b-7f85-4a14-88de-25ea9b8891a9	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	15936.38	382324.05	676.86	16237.88	4.247100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.43776	2026-01-11 20:07:08.43776	0.00	0.00	0.0000
04eefd2a-7af0-4fcc-b281-d84c36dadfe6	f32af08b-7f85-4a14-88de-25ea9b8891a9	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.27	1031.91	28140.21	22.94	625.70	2.223500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.446112	2026-01-11 20:07:08.446112	0.00	0.00	0.0000
57b46794-a84b-4da9-903d-cecc99db8856	91382ad1-8959-4271-98f5-1b220c66e9b3	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.50	3626.01	92464.13	216.11	5510.83	5.959900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.472133	2026-01-11 20:07:08.472133	0.00	0.00	0.0000
5185a57d-fa3c-4bcf-b295-e9e4a02b61a0	91382ad1-8959-4271-98f5-1b220c66e9b3	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7489.16	179667.32	310.39	7446.22	4.144400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.47947	2026-01-11 20:07:08.47947	0.00	0.00	0.0000
29811939-dbd3-455f-b8ed-afeb9532922f	91382ad1-8959-4271-98f5-1b220c66e9b3	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.80	2184.82	58553.33	31.79	852.03	1.455100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.48782	2026-01-11 20:07:08.48782	0.00	0.00	0.0000
71718b3c-024d-4cc6-bb7f-774f6c8b1d1c	4c8af61c-fa48-4ce8-8340-f2965913d5c1	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.10	667.07	18077.57	25.09	680.04	3.761700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.504369	2026-01-11 20:07:08.504369	0.00	0.00	0.0000
d2c17bb3-da9a-4368-8cdc-b76a3a056f0e	4c8af61c-fa48-4ce8-8340-f2965913d5c1	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4661.04	111816.51	143.19	3435.02	3.072000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.512401	2026-01-11 20:07:08.512401	0.00	0.00	0.0000
75f2fd47-e4c2-4987-beed-40519ba643f8	4c8af61c-fa48-4ce8-8340-f2965913d5c1	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.58	3036.22	83739.11	1.81	49.98	0.059600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.520726	2026-01-11 20:07:08.520726	0.00	0.00	0.0000
01d1a9c1-2285-4a09-abc7-36d5fccc8780	861796f0-a878-487c-bc18-b01359c48d05	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.50	3654.99	93200.69	193.10	4924.02	5.283200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.538895	2026-01-11 20:07:08.538895	0.00	0.00	0.0000
707d639f-d6e5-43d8-ab62-ab95908c1ee3	861796f0-a878-487c-bc18-b01359c48d05	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6267.29	150346.10	329.48	7904.10	5.257200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.545829	2026-01-11 20:07:08.545829	0.00	0.00	0.0000
66c51613-7438-4f03-a0df-c6771ad923f2	861796f0-a878-487c-bc18-b01359c48d05	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.80	3666.65	98266.21	13.13	352.00	0.358200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.554596	2026-01-11 20:07:08.554596	0.00	0.00	0.0000
8ea9de3f-671b-49fe-8949-145bad378fd7	4cced9c7-8881-4088-84a2-a11effaa2772	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	3529.31	96068.53	205.41	5591.33	5.820100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.572841	2026-01-11 20:07:08.572841	0.00	0.00	0.0000
0fe8df82-1086-41fc-99fb-7fe3334dcac5	4cced9c7-8881-4088-84a2-a11effaa2772	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	14694.94	352536.14	831.82	19955.16	5.660400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.579404	2026-01-11 20:07:08.579404	0.00	0.00	0.0000
edaaba9e-119a-4f97-9b4b-34ce2387408a	4cced9c7-8881-4088-84a2-a11effaa2772	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	55539.35	1509003.35	358.03	9727.72	0.644600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.587753	2026-01-11 20:07:08.587753	0.00	0.00	0.0000
8d426b30-b5e9-4c6f-99df-34623cc83ea5	e4397be6-c5a1-4980-b515-a239c75ba9f6	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	268.64	7331.15	10.65	290.56	3.963300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.605423	2026-01-11 20:07:08.605423	0.00	0.00	0.0000
e2920b8b-ac5d-4159-ada8-bc346c6f5b4d	e4397be6-c5a1-4980-b515-a239c75ba9f6	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4706.56	112910.54	259.70	6229.94	5.517500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.612839	2026-01-11 20:07:08.612839	0.00	0.00	0.0000
032eb6d6-30d7-4ee9-a24d-7daf39781b57	e4397be6-c5a1-4980-b515-a239c75ba9f6	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.09	1247.80	33803.06	47.81	1295.29	3.831800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.621198	2026-01-11 20:07:08.621198	0.00	0.00	0.0000
7bdf9d5f-f881-4e27-adab-640cc60c5e77	5febb256-1ff2-4e93-a15a-424ebd5503eb	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.638779	2026-01-11 20:07:08.638779	0.00	0.00	0.0000
08d01a4a-8377-4958-837b-3128ff9ae6c9	5febb256-1ff2-4e93-a15a-424ebd5503eb	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6208.17	148937.85	194.35	4662.46	3.130400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.646093	2026-01-11 20:07:08.646093	0.00	0.00	0.0000
8beb0b3d-093d-497e-872e-c59735f6246d	5febb256-1ff2-4e93-a15a-424ebd5503eb	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.59	2799.56	77239.85	36.43	1004.96	1.301000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.654344	2026-01-11 20:07:08.654344	0.00	0.00	0.0000
24c4e7ac-1b31-48cf-a830-ba3eb312bfae	89e42526-c783-4e3d-bd14-0e0a0e8bab95	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	4331.05	117891.05	202.18	5503.34	4.668100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.671679	2026-01-11 20:07:08.671679	0.00	0.00	0.0000
42b5492c-1d38-4cb6-b93d-1074428b5d31	89e42526-c783-4e3d-bd14-0e0a0e8bab95	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	14414.48	345809.38	493.92	11849.10	3.426400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.679166	2026-01-11 20:07:08.679166	0.00	0.00	0.0000
51cf7a0c-93f7-44e8-9bea-62320de67259	89e42526-c783-4e3d-bd14-0e0a0e8bab95	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1161.60	31560.83	6.32	171.70	0.544000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.687496	2026-01-11 20:07:08.687496	0.00	0.00	0.0000
0b897abf-fbc2-4c93-9f2d-d915d3c8a559	f79cfbc7-9bf6-4940-8111-df01a2d4ef7b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.705067	2026-01-11 20:07:08.705067	0.00	0.00	0.0000
94888141-0256-472e-a621-a7bc287d6859	f79cfbc7-9bf6-4940-8111-df01a2d4ef7b	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	9199.79	225304.81	371.06	9087.35	4.033300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.712353	2026-01-11 20:07:08.712353	0.00	0.00	0.0000
a30b057b-3f47-4f58-b1fd-d6707a1d66f6	f79cfbc7-9bf6-4940-8111-df01a2d4ef7b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.721073	2026-01-11 20:07:08.721073	0.00	0.00	0.0000
9cc34f10-ea0a-4be7-b12a-b49728c334b9	82ead00a-905f-43a2-9df6-813c5fdb25cf	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	1364.59	36707.89	15.63	420.47	1.145400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.738307	2026-01-11 20:07:08.738307	0.00	0.00	0.0000
9d3a9610-4c49-49be-99c6-ccf6a3bb9754	82ead00a-905f-43a2-9df6-813c5fdb25cf	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3110.36	74618.58	105.45	2529.79	3.390200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.746192	2026-01-11 20:07:08.746192	0.00	0.00	0.0000
f247d37d-3261-4c1e-ba45-41a3683724b2	82ead00a-905f-43a2-9df6-813c5fdb25cf	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.754162	2026-01-11 20:07:08.754162	0.00	0.00	0.0000
dda38637-48ce-487a-8445-5c50dcdd270e	9117f7ca-feda-4487-85ab-5cc4ec304302	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.29	314.72	8274.25	23.31	612.90	7.407300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.772045	2026-01-11 20:07:08.772045	0.00	0.00	0.0000
8b33b162-3c9b-4352-82a1-ba1d54b49b3d	9117f7ca-feda-4487-85ab-5cc4ec304302	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5782.86	138730.95	275.38	6606.21	4.761800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.779424	2026-01-11 20:07:08.779424	0.00	0.00	0.0000
effd8f92-9fc6-47d0-b522-1a252fac3445	9117f7ca-feda-4487-85ab-5cc4ec304302	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	3827.89	101783.84	5.65	150.09	0.147400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.787793	2026-01-11 20:07:08.787793	0.00	0.00	0.0000
ce3a1008-c8c0-4393-8ac5-fe0144f5bc64	e60466a3-1de2-45d7-91be-6ebfdee63868	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3925.47	105949.10	259.58	7006.24	6.612800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.805388	2026-01-11 20:07:08.805388	0.00	0.00	0.0000
55330942-5477-40f3-bb22-258a2ed4b005	e60466a3-1de2-45d7-91be-6ebfdee63868	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6452.86	154805.22	478.00	11467.03	7.407300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.812837	2026-01-11 20:07:08.812837	0.00	0.00	0.0000
1358429a-8534-4e51-94b1-95e85c5cb015	1ad22d08-00c1-40b8-bdbf-ca3d351cb8a4	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	9096.29	218225.20	292.56	7018.56	3.216200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.846191	2026-01-11 20:07:08.846191	0.00	0.00	0.0000
63245621-8195-4033-b982-8a096d59d096	aa95f422-27ea-4860-aef1-2d4fb0f8c5a8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	262.73	7170.02	4.74	129.34	1.803900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.871798	2026-01-11 20:07:08.871798	0.00	0.00	0.0000
7a306228-505b-4b23-abc4-9d100e29d719	aa95f422-27ea-4860-aef1-2d4fb0f8c5a8	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2198.25	52737.25	64.03	1536.04	2.912600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.879485	2026-01-11 20:07:08.879485	0.00	0.00	0.0000
aaed0da0-8fbf-40e4-941a-2500191e2626	aa95f422-27ea-4860-aef1-2d4fb0f8c5a8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.887833	2026-01-11 20:07:08.887833	0.00	0.00	0.0000
a6af5777-2f8b-40a4-824e-587f7f2c25f1	f27e64ab-0e73-42ed-8bc9-dfdfa46b75f0	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3114.36	84057.23	162.45	4384.47	5.216000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.905387	2026-01-11 20:07:08.905387	0.00	0.00	0.0000
eee17bcd-9dc5-4ae0-9045-e2e744d9cb76	f27e64ab-0e73-42ed-8bc9-dfdfa46b75f0	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8199.06	200796.73	385.30	9436.03	4.699200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.912917	2026-01-11 20:07:08.912917	0.00	0.00	0.0000
bb162702-7ebc-49da-919c-880466e20b96	f27e64ab-0e73-42ed-8bc9-dfdfa46b75f0	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.49	1160.79	31910.09	40.82	1122.24	3.516800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.921336	2026-01-11 20:07:08.921336	0.00	0.00	0.0000
82af9eda-7da4-4ddb-9f70-0939dbf924c5	e48a6887-da02-4da1-a39a-701464d932e5	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.92	1531.93	41238.20	97.98	2637.51	6.395700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.938892	2026-01-11 20:07:08.938892	0.00	0.00	0.0000
b1905ee0-9fab-4f92-a15a-e241a8589b7e	e48a6887-da02-4da1-a39a-701464d932e5	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5881.97	141097.43	257.15	6169.07	4.372200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.94591	2026-01-11 20:07:08.94591	0.00	0.00	0.0000
c00da8fd-97d9-46df-9805-ef2399b4262e	e48a6887-da02-4da1-a39a-701464d932e5	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	643.41	17494.32	18.44	501.23	2.865100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.954618	2026-01-11 20:07:08.954618	0.00	0.00	0.0000
e46915b9-4192-492d-b2ea-010a2ef4bc6d	d419b571-43e5-4b6a-aec6-c36c5cdc22ce	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	1804.94	48552.86	91.00	2447.78	5.041400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.972138	2026-01-11 20:07:08.972138	0.00	0.00	0.0000
96bec1c2-35dd-4b06-9c6d-dfe0fb42dd27	d419b571-43e5-4b6a-aec6-c36c5cdc22ce	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6774.27	162511.37	332.48	7976.21	4.908000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.979521	2026-01-11 20:07:08.979521	0.00	0.00	0.0000
8c3d639d-37ef-4cd2-bc2e-a954cc059e46	d419b571-43e5-4b6a-aec6-c36c5cdc22ce	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	1398.67	38029.75	36.72	998.32	2.625100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:08.98796	2026-01-11 20:07:08.98796	0.00	0.00	0.0000
852248a7-e234-454c-92d6-1303831bde40	b8f02737-2d59-4287-bab5-92ca6de5a081	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	1505.85	40989.35	97.90	2664.77	6.501100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.00548	2026-01-11 20:07:09.00548	0.00	0.00	0.0000
2b97da8a-911b-458f-b915-6526ffb6e5b7	b8f02737-2d59-4287-bab5-92ca6de5a081	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7240.18	173693.70	389.40	9341.70	5.378200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.012976	2026-01-11 20:07:09.012976	0.00	0.00	0.0000
37701c46-3faf-4fa9-812b-6b1452b534a2	b8f02737-2d59-4287-bab5-92ca6de5a081	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	11124.12	302242.88	244.03	6630.10	2.193600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.021249	2026-01-11 20:07:09.021249	0.00	0.00	0.0000
31d93ab2-6daf-4c37-86cf-aada9b824dd3	3d0c79d7-455e-456b-a8a6-6ba0c096b9ed	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.88	1698.89	43967.12	135.32	3502.10	7.965200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.038499	2026-01-11 20:07:09.038499	0.00	0.00	0.0000
54667b12-ac2c-4ad6-8051-1e6f6dbc8eb0	3d0c79d7-455e-456b-a8a6-6ba0c096b9ed	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7294.60	174997.55	270.56	6490.78	3.709000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.045973	2026-01-11 20:07:09.045973	0.00	0.00	0.0000
2f368f33-992c-49b9-a880-12d220bcaa10	3d0c79d7-455e-456b-a8a6-6ba0c096b9ed	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.70	4541.96	121270.43	5.62	149.98	0.123600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.0547	2026-01-11 20:07:09.0547	0.00	0.00	0.0000
1ae5676b-af71-47e1-a1ac-b44909bef907	5cf7c84e-c73a-45ac-a00d-983a97c65fee	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.35	5483.94	139016.07	452.80	11478.39	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.072225	2026-01-11 20:07:09.072225	0.00	0.00	0.0000
0a0d66aa-c49a-4549-973a-61286c7f66bb	5cf7c84e-c73a-45ac-a00d-983a97c65fee	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	13511.36	324141.07	1115.64	26763.94	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.079689	2026-01-11 20:07:09.079689	0.00	0.00	0.0000
521e60ae-90fa-4724-b5d2-514a2e2dd105	5cf7c84e-c73a-45ac-a00d-983a97c65fee	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.12	2654.29	69330.14	51.69	1350.10	1.947300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-11 20:07:09.087997	2026-01-11 20:07:09.087997	0.00	0.00	0.0000
133c8970-1bc3-45b6-97a7-e91278ba40a4	7643468d-c7d3-4828-9f73-a66bd581597b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	3565.09	95900.92	201.20	5412.32	5.643400	14946.00	0.00	0.00	0.00	0.00	0.00	11380.91	11582.00	2026-01-11 20:32:54.38559	2026-01-11 20:32:54.38559	201.09	5409.32	5.6405
e0e5bd01-966b-4b72-b4b1-6e257be0a499	7643468d-c7d3-4828-9f73-a66bd581597b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11754.71	281995.49	578.07	13867.75	4.917600	53860.00	0.00	0.00	0.00	0.00	0.00	42105.29	42683.00	2026-01-11 20:32:54.393938	2026-01-11 20:32:54.393938	577.71	13859.26	4.9147
35beb215-1fc3-406c-b226-37c53e7611f4	7643468d-c7d3-4828-9f73-a66bd581597b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	2176.22	59171.42	76.28	2074.11	3.505200	42607.00	0.00	0.00	0.00	0.00	0.00	40430.78	40507.00	2026-01-11 20:32:54.402652	2026-01-11 20:32:54.402652	76.22	2072.42	3.5024
9d394fd7-cd7e-44e9-b562-8ed43a8a37e5	b29b5077-bf66-450e-8097-e231178617dc	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	968.39	23716.04	45.55	1115.57	4.703800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.93895	2026-01-12 03:25:54.93895	0.00	0.00	0.0000
b4ee5ebe-a5a5-46cc-8beb-a94b10c3fced	b29b5077-bf66-450e-8097-e231178617dc	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.37	2678.04	70620.02	102.39	2699.89	3.823100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.947289	2026-01-12 03:25:54.947289	0.00	0.00	0.0000
ae01b6d3-8397-49de-9380-b6f2b58dfe57	40bd6708-060f-46c8-9974-aafefb60e796	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.39	819.14	21617.20	24.39	643.57	2.977100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.972568	2026-01-12 03:25:54.972568	0.00	0.00	0.0000
7634c5f7-9fcc-43ce-ac00-4ad497c59058	40bd6708-060f-46c8-9974-aafefb60e796	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4643.64	111403.74	209.03	5014.69	4.501300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.98108	2026-01-12 03:25:54.98108	0.00	0.00	0.0000
8fa2e104-e122-4c2b-8a31-86dce2a7d117	40bd6708-060f-46c8-9974-aafefb60e796	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:54.989354	2026-01-12 03:25:54.989354	0.00	0.00	0.0000
28e3ee38-cc76-4670-935a-bee8dbe2ce94	d0985673-8920-473d-b752-27c032820b3c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.09	2306.75	60184.27	58.22	1518.91	2.523700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.055775	2026-01-12 03:25:55.055775	0.00	0.00	0.0000
f4b3ed7d-6ef1-4de5-9c6e-6c872c38af69	d0985673-8920-473d-b752-27c032820b3c	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	9470.50	227200.10	388.32	9315.79	4.100200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.064385	2026-01-12 03:25:55.064385	0.00	0.00	0.0000
337b1a3d-99bf-4de3-8870-3dffa69a51bb	d0985673-8920-473d-b752-27c032820b3c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	788.42	21279.53	12.24	330.39	1.552600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.072551	2026-01-12 03:25:55.072551	0.00	0.00	0.0000
07c5af48-b330-4806-97dd-07e9e4f9ddad	0f89cf3a-0efb-4278-a5f6-4ea53834cbbe	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.09706	2026-01-12 03:25:55.09706	0.00	0.00	0.0000
fbfa4a74-afae-49e7-9224-7f319b04f966	0f89cf3a-0efb-4278-a5f6-4ea53834cbbe	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7208.09	172925.79	272.87	6546.10	3.785400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.105321	2026-01-12 03:25:55.105321	0.00	0.00	0.0000
cbc3f697-70be-4d47-83c8-5ed3dfb4eec1	0f89cf3a-0efb-4278-a5f6-4ea53834cbbe	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.67	1629.55	43460.20	16.87	449.98	1.035300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.113732	2026-01-12 03:25:55.113732	0.00	0.00	0.0000
b7d7603e-f85c-4faf-a5d2-a6c48d1f054f	9272dd2b-04ca-483b-8fcb-630f853dfe1f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.49	587.64	15566.58	31.54	835.39	5.366500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.138709	2026-01-12 03:25:55.138709	0.00	0.00	0.0000
06a26664-caf8-4523-a7ec-7334f0681c1b	9272dd2b-04ca-483b-8fcb-630f853dfe1f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	1682.71	40368.95	66.42	1593.39	3.947000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.147011	2026-01-12 03:25:55.147011	0.00	0.00	0.0000
186ebe34-f6c8-4740-bd15-203de1b026a2	9272dd2b-04ca-483b-8fcb-630f853dfe1f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.155927	2026-01-12 03:25:55.155927	0.00	0.00	0.0000
0426640e-1a7e-4c49-9518-c4c4e8041c8a	d63a8e21-041c-4ea1-ba7f-eacbf97560a0	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	1126.69	29958.57	43.58	1158.66	3.867500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.180773	2026-01-12 03:25:55.180773	0.00	0.00	0.0000
4fa97cf0-b3d1-406a-a5d6-18bdbcda8835	d63a8e21-041c-4ea1-ba7f-eacbf97560a0	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5533.65	132753.55	270.10	6479.56	4.880800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.189474	2026-01-12 03:25:55.189474	0.00	0.00	0.0000
fd0c0961-bb46-4ae6-900a-0bf98886b77e	d63a8e21-041c-4ea1-ba7f-eacbf97560a0	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.69	4753.30	126865.73	132.82	3545.07	2.794300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.197943	2026-01-12 03:25:55.197943	0.00	0.00	0.0000
3089785e-179c-4b17-afce-0fc204b41c17	980a3f22-e598-40e4-a900-c9dcbc9a8398	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	475.21	12664.40	10.45	278.46	2.198700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.22269	2026-01-12 03:25:55.22269	0.00	0.00	0.0000
565acd74-df90-4373-9d70-a77eb685ba35	980a3f22-e598-40e4-a900-c9dcbc9a8398	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2487.88	59685.27	90.13	2162.10	3.622500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.231164	2026-01-12 03:25:55.231164	0.00	0.00	0.0000
b4807fd3-2e43-48a8-a4b0-b7c52d37df83	980a3f22-e598-40e4-a900-c9dcbc9a8398	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	284.10	7667.81	61.62	1663.15	21.690000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.239367	2026-01-12 03:25:55.239367	0.00	0.00	0.0000
b8c3595b-bae2-405d-80f6-4acf4e4d2630	1e1e4bc8-dece-4507-a135-068a1d3eb2be	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	1356.92	36935.43	73.34	1996.21	5.404500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.26443	2026-01-12 03:25:55.26443	0.00	0.00	0.0000
03bad1cc-9235-4c42-a198-d8ea9b9adae3	1e1e4bc8-dece-4507-a135-068a1d3eb2be	a8e9ece3-c380-495c-b76e-713d7e322e98	23.98	3781.68	90686.21	158.06	3790.21	4.179400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.272839	2026-01-12 03:25:55.272839	0.00	0.00	0.0000
014be375-e053-46d2-9661-2dc656b8f93f	1e1e4bc8-dece-4507-a135-068a1d3eb2be	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	320.95	8720.21	42.33	1149.98	13.187500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.281176	2026-01-12 03:25:55.281176	0.00	0.00	0.0000
9be33eb8-6140-4891-bb42-7440e0cfb0c5	c386aea3-2f74-459e-8739-83e19b72de06	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.49	1693.75	44867.60	84.02	2225.64	4.960400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.305765	2026-01-12 03:25:55.305765	0.00	0.00	0.0000
d18ffff0-32c0-4757-846e-aca99f40aa18	c386aea3-2f74-459e-8739-83e19b72de06	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3508.10	84161.37	134.60	3229.04	3.836700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.314532	2026-01-12 03:25:55.314532	0.00	0.00	0.0000
894481f9-519a-4779-b61b-284f6b89f3c3	c386aea3-2f74-459e-8739-83e19b72de06	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.322672	2026-01-12 03:25:55.322672	0.00	0.00	0.0000
bf6d9ab3-e3b5-44f8-acf1-c07705227617	531a1506-108f-408a-a338-86d6c2d8e72a	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	1339.97	35628.31	71.75	1907.70	5.354400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.347461	2026-01-12 03:25:55.347461	0.00	0.00	0.0000
23323e9d-3e9e-4538-9d47-628576359e5f	531a1506-108f-408a-a338-86d6c2d8e72a	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4395.71	105444.51	185.96	4461.21	4.230800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.356194	2026-01-12 03:25:55.356194	0.00	0.00	0.0000
c33517ab-e988-4251-9365-a70b653baaa9	531a1506-108f-408a-a338-86d6c2d8e72a	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	90.45	2473.53	2.43	66.52	2.689200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.364206	2026-01-12 03:25:55.364206	0.00	0.00	0.0000
9f5ac6e9-c62b-44d8-b2c2-c088c0eb8578	56a06068-55b9-44b5-afcd-3abe511d6d12	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	1310.95	35379.99	69.43	1873.96	5.296600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.389144	2026-01-12 03:25:55.389144	0.00	0.00	0.0000
de4b2021-29dd-4b14-8233-3c73777afed6	56a06068-55b9-44b5-afcd-3abe511d6d12	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5548.74	133100.25	266.80	6400.39	4.808600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.397842	2026-01-12 03:25:55.397842	0.00	0.00	0.0000
a31062e2-c09a-4353-9fc3-a29b68c6d7cc	56a06068-55b9-44b5-afcd-3abe511d6d12	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.79	1990.57	53327.08	44.31	1186.98	2.225800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.406074	2026-01-12 03:25:55.406074	0.00	0.00	0.0000
afd86641-3340-41cd-9434-d7ec87076ccb	5d3aa996-1a94-426d-b4e7-32c4916b8929	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	1819.07	48550.64	93.53	2496.16	5.141300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.430817	2026-01-12 03:25:55.430817	0.00	0.00	0.0000
42c2dd70-ddbe-4ed0-b77d-614e1ba93f76	5d3aa996-1a94-426d-b4e7-32c4916b8929	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5345.69	128241.01	270.08	6479.27	5.052400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.439498	2026-01-12 03:25:55.439498	0.00	0.00	0.0000
8de4857e-6e6f-4ec9-a905-d8d7f3853eb1	5d3aa996-1a94-426d-b4e7-32c4916b8929	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	3173.88	85662.66	85.93	2319.14	2.707200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.447861	2026-01-12 03:25:55.447861	0.00	0.00	0.0000
a25163a1-756a-47e3-8f9e-cec10d5631eb	0bdd4c31-786d-4f87-9b0a-4bbdcdc267cc	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	6357.68	171595.56	332.76	8981.20	5.233900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.472758	2026-01-12 03:25:55.472758	0.00	0.00	0.0000
7d95a6cd-00cf-4a9f-9b95-80b2b884f3d7	0bdd4c31-786d-4f87-9b0a-4bbdcdc267cc	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	13127.60	321496.68	498.83	12216.46	3.799800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.481176	2026-01-12 03:25:55.481176	0.00	0.00	0.0000
78d44977-d3f0-4127-9ef7-45dc6d99a81f	0bdd4c31-786d-4f87-9b0a-4bbdcdc267cc	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.89	6768.54	182006.00	116.07	3121.06	1.714800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.489536	2026-01-12 03:25:55.489536	0.00	0.00	0.0000
3cc00462-aea2-4bab-8453-50516a38b674	c48fa837-7a09-4f5f-aeaa-3f704d83ac72	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.74	630.03	16846.81	36.80	983.98	5.840700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.514274	2026-01-12 03:25:55.514274	0.00	0.00	0.0000
9b082b58-c97a-4caa-82d0-9773e0b0940b	c48fa837-7a09-4f5f-aeaa-3f704d83ac72	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	1201.63	28827.96	56.18	1347.78	4.675200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.522834	2026-01-12 03:25:55.522834	0.00	0.00	0.0000
8c9fd00a-2ff4-482f-8258-9dc5da3f35c3	c48fa837-7a09-4f5f-aeaa-3f704d83ac72	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.19	3546.84	92891.80	95.98	2513.57	2.705900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.531132	2026-01-12 03:25:55.531132	0.00	0.00	0.0000
a9ed6521-17e8-475d-9ac4-0770412bf4c3	85e8a0bd-a670-4535-a11b-43acd5930efe	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	2101.95	56102.56	101.60	2711.56	4.833200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.556184	2026-01-12 03:25:55.556184	0.00	0.00	0.0000
2f6d6e4a-c026-4885-a118-c0b2d55f2198	85e8a0bd-a670-4535-a11b-43acd5930efe	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7720.70	185222.70	260.39	6246.67	3.372500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.564545	2026-01-12 03:25:55.564545	0.00	0.00	0.0000
7cbaa04e-3e63-4115-9906-1cea8bc96b6c	85e8a0bd-a670-4535-a11b-43acd5930efe	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.84	472.72	12687.78	12.64	339.21	2.673500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.572895	2026-01-12 03:25:55.572895	0.00	0.00	0.0000
08712604-e872-430e-8980-53f1e488ecce	9e4b3bf0-1c9e-433a-8b73-ac2b8399351f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	2281.94	61385.61	101.10	2719.59	4.430300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.597651	2026-01-12 03:25:55.597651	0.00	0.00	0.0000
c0ca0f9c-1de9-443c-9d1c-8ca4d341e13e	9e4b3bf0-1c9e-433a-8b73-ac2b8399351f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5070.74	121649.89	239.86	5754.30	4.730200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.606215	2026-01-12 03:25:55.606215	0.00	0.00	0.0000
3b033b07-a5b6-466e-8104-b5a4cbe2f325	9e4b3bf0-1c9e-433a-8b73-ac2b8399351f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	167.69	4559.58	10.37	281.82	6.180800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.614585	2026-01-12 03:25:55.614585	0.00	0.00	0.0000
44ac6211-72a1-4f52-9b23-218d8cfddeac	8b07c772-ce2c-482a-90e3-0e26ad5ae058	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.95	1457.91	39290.43	98.28	2648.70	6.741300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.639656	2026-01-12 03:25:55.639656	0.00	0.00	0.0000
341aa863-d351-4436-b799-0b7e8935a720	8b07c772-ce2c-482a-90e3-0e26ad5ae058	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3638.10	87276.83	233.54	5602.63	6.419300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.647932	2026-01-12 03:25:55.647932	0.00	0.00	0.0000
f61849a2-2bc1-46a7-80c9-08625c8af4fd	8b07c772-ce2c-482a-90e3-0e26ad5ae058	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.24	959.52	26136.90	39.11	1065.27	4.075700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.656275	2026-01-12 03:25:55.656275	0.00	0.00	0.0000
760e4a56-205e-4caa-985b-e2ce3cbdd7b9	6a508c12-e8bb-4b1f-a69e-e072e066fc1f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.95	2136.53	57576.99	134.17	3615.95	6.280100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.680937	2026-01-12 03:25:55.680937	0.00	0.00	0.0000
f9103e65-92bc-4796-8d4f-b3af01177f77	6a508c12-e8bb-4b1f-a69e-e072e066fc1f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6234.58	149556.30	365.46	8767.27	5.862100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.689538	2026-01-12 03:25:55.689538	0.00	0.00	0.0000
861fd5e1-14a2-4b85-ae19-f2274a9be49f	6a508c12-e8bb-4b1f-a69e-e072e066fc1f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.24	291.19	7931.76	11.27	307.05	3.871100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.697951	2026-01-12 03:25:55.697951	0.00	0.00	0.0000
03514dd8-a6a5-47e0-b93d-86f8dcbadc6d	cfbd63e3-510d-4ea6-a87a-3f9eb61ed1c2	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3211.75	86686.43	148.78	4015.64	4.632300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.722819	2026-01-12 03:25:55.722819	0.00	0.00	0.0000
f417b951-80d6-4956-90b1-7f1c272c21f5	cfbd63e3-510d-4ea6-a87a-3f9eb61ed1c2	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11615.26	278655.32	561.78	13477.09	4.836400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.731268	2026-01-12 03:25:55.731268	0.00	0.00	0.0000
5b380446-3111-44e6-ab4a-b23b3e21d73c	cfbd63e3-510d-4ea6-a87a-3f9eb61ed1c2	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.79	3124.44	83703.94	85.50	2290.60	2.736500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.73967	2026-01-12 03:25:55.73967	0.00	0.00	0.0000
7b15b29e-dca7-4b5b-a82e-5bdcf2572b88	af3410be-f5f0-4ed5-96ad-e42f53251dbd	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.764625	2026-01-12 03:25:55.764625	0.00	0.00	0.0000
75f51a64-1643-47eb-b019-9a566aa2ef55	af3410be-f5f0-4ed5-96ad-e42f53251dbd	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	11627.40	278920.26	597.25	14327.82	5.136800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.772922	2026-01-12 03:25:55.772922	0.00	0.00	0.0000
4418908f-7393-4627-b37c-679c04c3f195	af3410be-f5f0-4ed5-96ad-e42f53251dbd	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.64	1494.47	39812.40	50.68	1350.10	3.391100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.781326	2026-01-12 03:25:55.781326	0.00	0.00	0.0000
25f5bf9b-b70a-4788-ab2c-0fec3cc0ec90	b8ab2048-d945-4ed8-9c09-7f701f4d7001	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	3573.70	95377.86	199.63	5328.03	5.586200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.807362	2026-01-12 03:25:55.807362	0.00	0.00	0.0000
1d81b1dc-885c-4e19-b385-7da23241b118	b8ab2048-d945-4ed8-9c09-7f701f4d7001	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3772.80	90503.12	168.67	4046.41	4.471000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.814549	2026-01-12 03:25:55.814549	0.00	0.00	0.0000
51e4a0c1-f0f3-410d-be84-b751278c021d	b8ab2048-d945-4ed8-9c09-7f701f4d7001	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.823071	2026-01-12 03:25:55.823071	0.00	0.00	0.0000
b5e46256-7dcd-47ec-bdf2-5f59e472f02f	63d72846-350d-42ab-9e67-20d630cd9bd8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2002.31	54043.32	49.97	1348.58	2.495300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.847458	2026-01-12 03:25:55.847458	0.00	0.00	0.0000
f681156a-c89c-420e-bd53-d68b6023f4f5	63d72846-350d-42ab-9e67-20d630cd9bd8	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	5060.52	123933.66	161.66	3958.96	3.194400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.85577	2026-01-12 03:25:55.85577	0.00	0.00	0.0000
2ad67207-1dd8-4027-ac89-142b5c9faf90	63d72846-350d-42ab-9e67-20d630cd9bd8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	406.27	11111.53	4.20	114.99	1.034800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.86402	2026-01-12 03:25:55.86402	0.00	0.00	0.0000
8865c89f-bd07-460c-b4ff-101a559d4859	ba58fbca-dc78-4367-b81d-87752fb4f006	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.09	2578.34	69847.39	124.75	3379.42	4.838200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.889494	2026-01-12 03:25:55.889494	0.00	0.00	0.0000
138cee01-02d7-492a-b1c4-9e859557f6c9	ba58fbca-dc78-4367-b81d-87752fb4f006	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7022.95	168482.70	281.34	6749.25	4.005900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.897927	2026-01-12 03:25:55.897927	0.00	0.00	0.0000
e35038dc-6b83-4bde-a2d0-7995b80e014b	ba58fbca-dc78-4367-b81d-87752fb4f006	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	1151.95	31298.51	36.80	999.94	3.194800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.906324	2026-01-12 03:25:55.906324	0.00	0.00	0.0000
b8312cc0-a460-4bf5-8475-33280a823732	134a8ddf-0a97-4f90-91f4-493292c31942	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3959.70	106873.73	228.16	6158.18	5.762100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.931332	2026-01-12 03:25:55.931332	0.00	0.00	0.0000
f1c9465a-03f3-4c60-ba38-fd42e93c5d1d	134a8ddf-0a97-4f90-91f4-493292c31942	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8416.44	206119.84	375.55	9197.24	4.462000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.939555	2026-01-12 03:25:55.939555	0.00	0.00	0.0000
9c5af39c-9e1c-496a-8b7d-bd2dfd7632f2	134a8ddf-0a97-4f90-91f4-493292c31942	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	1251.03	34215.81	58.39	1597.03	4.667500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.947729	2026-01-12 03:25:55.947729	0.00	0.00	0.0000
84067911-7513-4d48-a64d-c942f5f0786a	9c80572a-cffc-4723-8046-e92e863704d9	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	938.24	25323.42	61.38	1656.65	6.541900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.972703	2026-01-12 03:25:55.972703	0.00	0.00	0.0000
2d6e4b63-1775-4da3-908f-e0ad2b16bf42	9c80572a-cffc-4723-8046-e92e863704d9	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	6298.72	154256.90	274.83	6730.66	4.363200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.981364	2026-01-12 03:25:55.981364	0.00	0.00	0.0000
c6222123-1d65-4f79-8f91-590310019899	9c80572a-cffc-4723-8046-e92e863704d9	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	688.89	18841.06	41.68	1139.95	6.050300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:55.989568	2026-01-12 03:25:55.989568	0.00	0.00	0.0000
1e68cefd-a243-462b-a23f-ab36b2b651a0	cf34c088-268b-44b3-99df-32ee068e1590	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	3608.22	98216.56	193.22	5259.47	5.354900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.014471	2026-01-12 03:25:56.014471	0.00	0.00	0.0000
b46ef0f8-0581-4ab9-8be9-2767e1e17e8d	cf34c088-268b-44b3-99df-32ee068e1590	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10201.22	244731.60	488.17	11711.12	4.785200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.022995	2026-01-12 03:25:56.022995	0.00	0.00	0.0000
1d3d4db5-043a-4ef7-9447-d5a148b83749	cf34c088-268b-44b3-99df-32ee068e1590	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	576.60	15666.44	17.41	473.15	3.020100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.031169	2026-01-12 03:25:56.031169	0.00	0.00	0.0000
fba9a6e9-74a4-45fe-8a71-e360d90ad7c6	adc0fff9-e570-40f0-926e-38e2730e66ee	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2918.37	78767.99	53.03	1431.39	1.817200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.056337	2026-01-12 03:25:56.056337	0.00	0.00	0.0000
1ad5f210-ea8d-4a16-8dd7-e4bac7ff5d71	adc0fff9-e570-40f0-926e-38e2730e66ee	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	11244.25	275375.04	305.65	7485.49	2.718200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.064552	2026-01-12 03:25:56.064552	0.00	0.00	0.0000
8455c453-a4bb-4c38-9c7b-26b3bb8bd219	adc0fff9-e570-40f0-926e-38e2730e66ee	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.073011	2026-01-12 03:25:56.073011	0.00	0.00	0.0000
9d6a6c06-85bb-43b9-a3fa-77a522a19217	dd66f407-475a-418b-aaff-0b7c9d6277c2	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.097726	2026-01-12 03:25:56.097726	0.00	0.00	0.0000
6e564a95-765b-4821-9a71-7f34d5975750	dd66f407-475a-418b-aaff-0b7c9d6277c2	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5670.58	136039.97	249.14	5976.82	4.393400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.106324	2026-01-12 03:25:56.106324	0.00	0.00	0.0000
267d98f2-fa8f-41ce-b791-fc6ac74994ee	dd66f407-475a-418b-aaff-0b7c9d6277c2	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	211.52	5708.88	36.15	975.76	17.091900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.114762	2026-01-12 03:25:56.114762	0.00	0.00	0.0000
cf0837c5-dd3a-4c06-bec7-4b5a88cc0788	e2e7437d-cef2-41df-9a75-6454eb18f6f7	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.69	3556.85	94934.41	190.02	5071.49	5.342000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.139625	2026-01-12 03:25:56.139625	0.00	0.00	0.0000
cfe44c4b-ee3e-4fe5-9f57-8bd5c6ccb897	e2e7437d-cef2-41df-9a75-6454eb18f6f7	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	22271.04	534288.82	1758.02	42174.66	7.893600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.14808	2026-01-12 03:25:56.14808	0.00	0.00	0.0000
93facc83-0124-4f4e-a342-a679740dece0	e2e7437d-cef2-41df-9a75-6454eb18f6f7	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.84	1217.09	32666.71	40.48	1086.51	3.326000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.156411	2026-01-12 03:25:56.156411	0.00	0.00	0.0000
80f4232f-35f6-44c3-851d-28746b6660d5	862159e9-d9ca-4ecd-9285-c09b5ba4a638	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.75	5840.58	156232.62	356.00	9523.07	6.095400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.181418	2026-01-12 03:25:56.181418	0.00	0.00	0.0000
21c16bf5-2a59-485e-a87f-be7337c45f62	862159e9-d9ca-4ecd-9285-c09b5ba4a638	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10141.18	243276.27	602.18	14446.16	5.938100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.189824	2026-01-12 03:25:56.189824	0.00	0.00	0.0000
9d1c630c-6cfc-4b08-b16b-ab2c37d50eca	862159e9-d9ca-4ecd-9285-c09b5ba4a638	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.95	2177.70	58688.58	38.04	1025.26	1.746900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.198072	2026-01-12 03:25:56.198072	0.00	0.00	0.0000
a6f6c10b-1d2b-4792-bea0-3621672f828e	e1d03885-0bed-4fd8-a157-94c569f2de6c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.223036	2026-01-12 03:25:56.223036	0.00	0.00	0.0000
69451b41-2b2b-4b0d-bfb2-ae07b87f6020	e1d03885-0bed-4fd8-a157-94c569f2de6c	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8909.72	218200.74	485.42	11887.93	5.448100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.231346	2026-01-12 03:25:56.231346	0.00	0.00	0.0000
37ddc556-4b2d-429d-9e9e-7c2a754e0f16	e1d03885-0bed-4fd8-a157-94c569f2de6c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.19	3902.61	102209.56	48.19	1262.03	1.234700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.239655	2026-01-12 03:25:56.239655	0.00	0.00	0.0000
258af851-900a-48f6-90cd-5ee358783ff0	04c5571a-1569-43b9-8936-d73946590b09	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.15	2844.55	77230.92	111.32	3022.39	3.913400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.264846	2026-01-12 03:25:56.264846	0.00	0.00	0.0000
96769a2a-8792-4c5a-8bd3-9b6c7754547c	04c5571a-1569-43b9-8936-d73946590b09	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8154.71	195635.50	441.20	10584.39	5.410200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.273118	2026-01-12 03:25:56.273118	0.00	0.00	0.0000
de74d696-38b0-4909-ba72-41db67eb6d2f	04c5571a-1569-43b9-8936-d73946590b09	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.44	789.67	21668.47	58.33	1600.44	7.386000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.281491	2026-01-12 03:25:56.281491	0.00	0.00	0.0000
647452d7-8176-4bb9-ab88-87db421cc5ca	010afafb-4045-4fbe-b6b4-e9bfb109fae8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2445.81	66010.98	130.52	3522.62	5.336400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.30638	2026-01-12 03:25:56.30638	0.00	0.00	0.0000
b7e52a34-c28b-4349-9cba-52c297d591ef	010afafb-4045-4fbe-b6b4-e9bfb109fae8	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4002.93	96027.64	212.99	5109.65	5.321000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.314759	2026-01-12 03:25:56.314759	0.00	0.00	0.0000
c3bb7600-4dc8-4d02-bff1-9715757bffc7	010afafb-4045-4fbe-b6b4-e9bfb109fae8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.3231	2026-01-12 03:25:56.3231	0.00	0.00	0.0000
a98836c0-d1e6-49d3-a1f9-79a14b8a3c39	a2d733f2-995c-4f6d-aec3-695bae0f8f53	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	266.91	7283.96	20.81	567.84	7.795700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.348178	2026-01-12 03:25:56.348178	0.00	0.00	0.0000
1d9bb756-6d25-457e-a976-2098e86311a5	a2d733f2-995c-4f6d-aec3-695bae0f8f53	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	1325.32	31794.77	65.83	1579.14	4.966600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.356489	2026-01-12 03:25:56.356489	0.00	0.00	0.0000
3fbc30a5-3b59-433a-9b81-785808cfd269	a2d733f2-995c-4f6d-aec3-695bae0f8f53	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.09	1561.90	42311.77	10.36	280.77	0.663500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.364492	2026-01-12 03:25:56.364492	0.00	0.00	0.0000
dcb81755-3fe1-453a-a02f-aee7db3a14c7	4630d23c-6da6-4a74-97a2-ed094a968b88	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	2617.85	70656.43	189.25	5107.78	7.229000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.389765	2026-01-12 03:25:56.389765	0.00	0.00	0.0000
8b026fd5-029f-4bfe-85ba-acf09b3f0ec8	4630d23c-6da6-4a74-97a2-ed094a968b88	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	6137.65	150311.50	466.23	11418.12	7.596300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.398082	2026-01-12 03:25:56.398082	0.00	0.00	0.0000
f0abb670-417b-4c4b-a833-bd189336a0e1	4630d23c-6da6-4a74-97a2-ed094a968b88	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.35	333.73	9127.55	15.65	428.09	4.690000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.406524	2026-01-12 03:25:56.406524	0.00	0.00	0.0000
7abc56d6-ff20-4dbb-b6ba-ba6c2cf742d9	65c0350b-231e-4c9f-9d82-616339967be2	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.27	934.09	25472.62	36.74	1002.01	3.933600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.431655	2026-01-12 03:25:56.431655	0.00	0.00	0.0000
0d015527-9173-4a70-887f-d3aa1aa3be0c	65c0350b-231e-4c9f-9d82-616339967be2	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5157.62	123733.33	189.71	4551.06	3.678100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.439823	2026-01-12 03:25:56.439823	0.00	0.00	0.0000
c7257fe2-7206-4581-99e5-6f5dab1a0469	65c0350b-231e-4c9f-9d82-616339967be2	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.448142	2026-01-12 03:25:56.448142	0.00	0.00	0.0000
442a944e-6937-4889-bd8e-6c2de89d0111	c65f258f-7717-4a59-901c-e2ea8e73395a	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3361.25	90721.05	197.91	5341.70	5.888000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.473147	2026-01-12 03:25:56.473147	0.00	0.00	0.0000
e4482786-4735-4047-90ba-08360d593d2d	c65f258f-7717-4a59-901c-e2ea8e73395a	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8509.25	208392.80	450.40	11030.35	5.293000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.481515	2026-01-12 03:25:56.481515	0.00	0.00	0.0000
e7519062-d646-4231-9063-081e6e45759a	c65f258f-7717-4a59-901c-e2ea8e73395a	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.49	535.01	14707.49	1.83	50.42	0.342800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.489755	2026-01-12 03:25:56.489755	0.00	0.00	0.0000
2da7c476-f6ea-4367-b1db-db89c9ef2a81	f13fdd70-2a6e-4fd9-be63-6d171a74e133	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.89	408.52	10576.71	18.45	477.70	4.516500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.514782	2026-01-12 03:25:56.514782	0.00	0.00	0.0000
a445b5fe-65bd-4247-b037-ed97b6c8605d	f13fdd70-2a6e-4fd9-be63-6d171a74e133	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2728.98	65469.25	147.52	3538.87	5.405300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.523051	2026-01-12 03:25:56.523051	0.00	0.00	0.0000
b7de3143-ffa2-4971-b195-b84e5980c21e	f13fdd70-2a6e-4fd9-be63-6d171a74e133	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.97	1739.55	46915.68	146.46	3949.97	8.419200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.531481	2026-01-12 03:25:56.531481	0.00	0.00	0.0000
f39e5f58-9257-4290-89d6-76e550a28275	b6de1f52-e3c6-4f5f-8aed-f06abdde75c2	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	758.81	20480.71	26.64	718.92	3.510200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.556506	2026-01-12 03:25:56.556506	0.00	0.00	0.0000
c452e824-8be7-478f-a486-8ec40ae9b71e	b6de1f52-e3c6-4f5f-8aed-f06abdde75c2	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5361.31	128621.25	189.08	4535.90	3.526500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.564819	2026-01-12 03:25:56.564819	0.00	0.00	0.0000
b7a8b8ac-8eff-4596-9f0c-64d6f9e45cea	b6de1f52-e3c6-4f5f-8aed-f06abdde75c2	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.573172	2026-01-12 03:25:56.573172	0.00	0.00	0.0000
0a942f15-a9d9-4a0d-a438-bacfa276447d	3dca0f19-885c-401d-a814-9c87a87c4077	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	522.14	14249.33	15.01	409.73	2.875400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.59731	2026-01-12 03:25:56.59731	0.00	0.00	0.0000
9b9195ca-3afe-4263-89e7-6b667ac09dc3	3dca0f19-885c-401d-a814-9c87a87c4077	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3124.76	74965.29	85.04	2040.05	2.721300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.606676	2026-01-12 03:25:56.606676	0.00	0.00	0.0000
346a6f64-dff9-4a02-8c78-822facd644fb	3dca0f19-885c-401d-a814-9c87a87c4077	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	148.00	3994.42	3.71	100.15	2.507200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.614809	2026-01-12 03:25:56.614809	0.00	0.00	0.0000
a152803f-b88a-4a05-8563-d653fee19e23	6de5f1fd-6d50-493b-b395-cfafba67ec2b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.79	4179.13	111962.72	188.59	5052.11	4.512300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.639751	2026-01-12 03:25:56.639751	0.00	0.00	0.0000
73026cac-a7a0-44ea-ada1-bf8b8a707e69	6de5f1fd-6d50-493b-b395-cfafba67ec2b	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	96.65	2367.05	7.98	195.46	8.257500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.64808	2026-01-12 03:25:56.64808	0.00	0.00	0.0000
904508d9-7550-4cb4-9f9f-f8b96ec123ee	6de5f1fd-6d50-493b-b395-cfafba67ec2b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	25.99	15660.17	407008.01	41.29	1073.10	0.263600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.656525	2026-01-12 03:25:56.656525	0.00	0.00	0.0000
b2b41346-b08e-4614-9fe4-de8cc9acdb90	0f0e63dc-00aa-4686-bf52-feffc1d33bf5	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	410.65	10943.77	33.91	903.62	8.256900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.681523	2026-01-12 03:25:56.681523	0.00	0.00	0.0000
f4291ac6-da60-4e95-bd32-34560b9b41ad	0f0e63dc-00aa-4686-bf52-feffc1d33bf5	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2343.36	56217.70	90.13	2162.21	3.846100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.689831	2026-01-12 03:25:56.689831	0.00	0.00	0.0000
6ed87579-7306-41bd-af5b-447e6bf6966e	0f0e63dc-00aa-4686-bf52-feffc1d33bf5	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.698156	2026-01-12 03:25:56.698156	0.00	0.00	0.0000
8e4dadea-6c5f-47c5-9c14-540008287d6c	4030d7ac-031e-45a8-98b5-c9b7c33b5b21	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.47	314.04	8312.60	6.96	184.34	2.217500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.723179	2026-01-12 03:25:56.723179	0.00	0.00	0.0000
7b043ef2-f23f-4768-9c9c-eadbf1c337bf	4030d7ac-031e-45a8-98b5-c9b7c33b5b21	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	1835.19	44027.55	63.77	1529.79	3.474600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.731538	2026-01-12 03:25:56.731538	0.00	0.00	0.0000
2d533e18-35a6-4461-9742-54941147a6ef	4030d7ac-031e-45a8-98b5-c9b7c33b5b21	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	3215.30	86780.97	20.37	549.92	0.633600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.739822	2026-01-12 03:25:56.739822	0.00	0.00	0.0000
cbeb2952-bc8f-431d-9734-97f7c5581d1c	5cec217f-e4c3-4554-9b87-f7cfd5e46fae	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	4003.24	108968.37	275.79	7507.09	6.889200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.764826	2026-01-12 03:25:56.764826	0.00	0.00	0.0000
a3c4d584-3660-41ad-83bd-b245eedef1a2	5cec217f-e4c3-4554-9b87-f7cfd5e46fae	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10678.08	256171.63	417.64	10019.03	3.911000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.773186	2026-01-12 03:25:56.773186	0.00	0.00	0.0000
1dfee755-24ab-470b-b650-262e03185ec0	5cec217f-e4c3-4554-9b87-f7cfd5e46fae	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	24819.78	674353.46	7.76	210.93	0.031200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.781684	2026-01-12 03:25:56.781684	0.00	0.00	0.0000
9691f77e-3b44-4c1f-8381-4be3984451d3	edef6d77-69cf-4e97-a194-73a40baf2011	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	572.74	15630.20	61.78	1685.86	10.785900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.806472	2026-01-12 03:25:56.806472	0.00	0.00	0.0000
47b1afee-630c-4854-9c75-298a6c9f06e9	edef6d77-69cf-4e97-a194-73a40baf2011	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2992.08	71780.43	137.58	3300.48	4.598000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.814891	2026-01-12 03:25:56.814891	0.00	0.00	0.0000
2eec27c7-7148-448c-bf36-fe03fccf6388	edef6d77-69cf-4e97-a194-73a40baf2011	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.82317	2026-01-12 03:25:56.82317	0.00	0.00	0.0000
5a31203d-57e4-4464-b47e-da8c7061ce19	184dc0bb-2d21-477c-b796-c9901d8cd724	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.09	3191.30	86452.96	263.50	7138.32	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.848406	2026-01-12 03:25:56.848406	0.00	0.00	0.0000
668f1c07-3588-4461-b4c2-9848ec4c44d5	184dc0bb-2d21-477c-b796-c9901d8cd724	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6093.87	146195.17	290.19	6961.66	4.761800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.856217	2026-01-12 03:25:56.856217	0.00	0.00	0.0000
f01cdc41-ee7f-4be3-8ec9-2acf2331b654	184dc0bb-2d21-477c-b796-c9901d8cd724	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	644.15	17501.55	4.34	117.94	0.673800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.864521	2026-01-12 03:25:56.864521	0.00	0.00	0.0000
99521dc6-d7da-4ad5-bf75-c860ebeeca71	2ba6d707-c06e-4432-bb30-38cb5482b2a6	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.88982	2026-01-12 03:25:56.88982	0.00	0.00	0.0000
972806c8-d567-4e84-b184-f7326459c123	2ba6d707-c06e-4432-bb30-38cb5482b2a6	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8949.21	214696.28	469.74	11269.07	5.248800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.898226	2026-01-12 03:25:56.898226	0.00	0.00	0.0000
f348ee6f-9480-4a20-85d9-4eebef08162a	2ba6d707-c06e-4432-bb30-38cb5482b2a6	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	442.23	12015.39	23.77	645.82	5.374900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.906228	2026-01-12 03:25:56.906228	0.00	0.00	0.0000
2c3b1da7-ad96-4e60-bb59-dcc50f8ee5eb	1febbd38-2494-41fa-a41c-111bc696df32	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.49	461.63	11766.95	38.12	971.56	8.256600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.930933	2026-01-12 03:25:56.930933	0.00	0.00	0.0000
4b8c9616-da2c-4ca9-b23d-2461b0e075d5	1febbd38-2494-41fa-a41c-111bc696df32	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	891.93	21397.68	60.72	1456.70	6.807700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.939448	2026-01-12 03:25:56.939448	0.00	0.00	0.0000
8a9989b3-392d-4ca5-8bcc-1099c688cb0d	1febbd38-2494-41fa-a41c-111bc696df32	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.947759	2026-01-12 03:25:56.947759	0.00	0.00	0.0000
fd886375-2ab3-4283-a44d-dcb4d866220d	5d1924c9-97b8-4f9e-9af1-c9b62b2c8293	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	1520.53	40431.04	96.87	2575.86	6.370900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:56.972997	2026-01-12 03:25:56.972997	0.00	0.00	0.0000
83fef64c-a533-45fa-84ab-40e3638e84bf	5d1924c9-97b8-4f9e-9af1-c9b62b2c8293	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6625.43	158945.99	301.58	7234.92	4.551800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.00673	2026-01-12 03:25:57.00673	0.00	0.00	0.0000
a849c057-eba6-494d-905b-4ffaaf1c72d0	5d1924c9-97b8-4f9e-9af1-c9b62b2c8293	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.67	179.61	4790.16	16.87	449.98	9.393800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.014813	2026-01-12 03:25:57.014813	0.00	0.00	0.0000
c7b64155-3c4e-430f-ad62-f3df5903ca0f	52b1ac74-8bdc-474b-b2ee-972dcc61d1f1	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	643.99	17574.85	16.06	438.20	2.493300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.039901	2026-01-12 03:25:57.039901	0.00	0.00	0.0000
c42bc075-18a5-48b6-b758-da4c985c75c3	52b1ac74-8bdc-474b-b2ee-972dcc61d1f1	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3900.10	93566.41	132.49	3178.46	3.397000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.048229	2026-01-12 03:25:57.048229	0.00	0.00	0.0000
768803d9-9096-4322-b4bc-2a45272e9ba7	52b1ac74-8bdc-474b-b2ee-972dcc61d1f1	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.056649	2026-01-12 03:25:57.056649	0.00	0.00	0.0000
01f84faf-b808-4a66-a9ce-6d5287f83d29	690117a1-a139-4fa0-8b8b-6869a13f94d7	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.65	386.09	10289.51	15.28	407.29	3.958300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.081239	2026-01-12 03:25:57.081239	0.00	0.00	0.0000
71b1e4a3-4d15-4352-9771-4997ba104ce4	690117a1-a139-4fa0-8b8b-6869a13f94d7	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2765.67	66349.69	102.06	2448.31	3.690000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.089892	2026-01-12 03:25:57.089892	0.00	0.00	0.0000
c9ee846f-c4b3-48bc-8eac-7b857641367e	690117a1-a139-4fa0-8b8b-6869a13f94d7	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	318.64	8600.29	16.68	450.10	5.233500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.098047	2026-01-12 03:25:57.098047	0.00	0.00	0.0000
fb520f3c-48a4-4f01-b95a-ea8851bdaab6	5e37dfd6-2647-4c49-80f5-2a4bf39a0e2c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	275.89	7418.54	34.77	934.84	12.601400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.123182	2026-01-12 03:25:57.123182	0.00	0.00	0.0000
02fbe650-cc28-4f99-8d83-91c45656defa	5e37dfd6-2647-4c49-80f5-2a4bf39a0e2c	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2931.37	70324.64	149.70	3591.20	5.106600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.131494	2026-01-12 03:25:57.131494	0.00	0.00	0.0000
f9165da0-fb0e-40f6-b927-3251c1413e79	5e37dfd6-2647-4c49-80f5-2a4bf39a0e2c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.13955	2026-01-12 03:25:57.13955	0.00	0.00	0.0000
b48af9b8-31df-4b84-a0aa-5d598c120fed	544d6b39-caea-4bb5-83e5-78ac544743b5	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	361.36	9861.72	14.45	394.29	3.998100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.164696	2026-01-12 03:25:57.164696	0.00	0.00	0.0000
87db4132-08ee-4544-934d-0bb9063f3989	544d6b39-caea-4bb5-83e5-78ac544743b5	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2192.27	52594.30	100.21	2404.02	4.570800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.173033	2026-01-12 03:25:57.173033	0.00	0.00	0.0000
4c4e5705-69aa-4b69-80a8-76956c73ad9a	544d6b39-caea-4bb5-83e5-78ac544743b5	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.181284	2026-01-12 03:25:57.181284	0.00	0.00	0.0000
20ccdc88-c4c9-4ca9-a593-ab072c8e16c2	c6e21930-116d-40b2-a887-b49f5f93fafa	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	419.41	11278.02	25.37	682.13	6.048300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.206026	2026-01-12 03:25:57.206026	0.00	0.00	0.0000
4d17e1a7-faee-43d8-8c21-542b0e851bf2	c6e21930-116d-40b2-a887-b49f5f93fafa	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	1415.30	33953.71	29.16	699.63	2.060500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.214397	2026-01-12 03:25:57.214397	0.00	0.00	0.0000
7e64b96b-9076-44e8-a4c9-a2dbddd846db	c6e21930-116d-40b2-a887-b49f5f93fafa	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.222504	2026-01-12 03:25:57.222504	0.00	0.00	0.0000
488c826b-2dc3-4143-a951-d162c13f8e17	51652ca4-af33-4f91-bd31-f812693f7197	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	824.38	22167.61	33.08	889.41	4.012200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.247534	2026-01-12 03:25:57.247534	0.00	0.00	0.0000
a5344365-4a42-476a-b399-967255126a20	51652ca4-af33-4f91-bd31-f812693f7197	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	6945.82	166635.34	270.25	6483.22	3.890600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.25578	2026-01-12 03:25:57.25578	0.00	0.00	0.0000
ef365f02-9e0f-4952-9d6a-18a3c41fd3bc	51652ca4-af33-4f91-bd31-f812693f7197	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.99	294.37	7944.95	18.26	492.89	6.203800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.264178	2026-01-12 03:25:57.264178	0.00	0.00	0.0000
4aad2710-f059-49b4-be74-08a418608791	b9e71281-71e7-4d82-88cf-13ec3785ff06	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.28931	2026-01-12 03:25:57.28931	0.00	0.00	0.0000
acbbb397-5db3-437c-8c90-126846130bd8	b9e71281-71e7-4d82-88cf-13ec3785ff06	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4574.10	109735.15	258.73	6206.77	5.656100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.298241	2026-01-12 03:25:57.298241	0.00	0.00	0.0000
ed7ae62b-0f43-4e0c-b706-58f1d2c2a50c	b9e71281-71e7-4d82-88cf-13ec3785ff06	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.27	2131.95	58138.28	20.17	550.00	0.946000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.306513	2026-01-12 03:25:57.306513	0.00	0.00	0.0000
532cabb0-2fcb-492f-8277-56c4ae4ffed4	da3a759b-66d0-4765-99d3-4dd458844638	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.50	1504.92	38376.30	73.17	1865.81	4.861800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.331253	2026-01-12 03:25:57.331253	0.00	0.00	0.0000
7c4cab4b-0ce9-4cf9-82a9-082016842187	da3a759b-66d0-4765-99d3-4dd458844638	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5910.22	141788.10	381.27	9146.68	6.450900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.339647	2026-01-12 03:25:57.339647	0.00	0.00	0.0000
ca384e87-5692-4a59-862e-23629eed2c5c	da3a759b-66d0-4765-99d3-4dd458844638	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.348242	2026-01-12 03:25:57.348242	0.00	0.00	0.0000
36d586ee-4bc2-4bff-84c3-b063c9b949e3	591e5b94-fe0c-41c8-b8a3-4149957bddba	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.10	371.78	10074.73	12.94	350.62	3.480100	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.373295	2026-01-12 03:25:57.373295	0.00	0.00	0.0000
ae3ec9b5-be72-4c2c-9d57-25cc9feddce2	591e5b94-fe0c-41c8-b8a3-4149957bddba	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3705.32	88886.23	116.91	2804.67	3.155300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.381491	2026-01-12 03:25:57.381491	0.00	0.00	0.0000
2f0131ac-4e8e-4b98-9bc1-f13d4faf3fa7	591e5b94-fe0c-41c8-b8a3-4149957bddba	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.58	103.74	2861.11	6.54	180.49	6.308300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.390053	2026-01-12 03:25:57.390053	0.00	0.00	0.0000
618de9fd-9126-4c48-a969-bce3df07d4a4	ed062451-6c52-4531-8307-77a35b5b56c5	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.50	2004.63	51116.90	110.43	2816.07	5.509000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.414938	2026-01-12 03:25:57.414938	0.00	0.00	0.0000
cb680837-45b1-4d46-bddf-ae61689f66bd	ed062451-6c52-4531-8307-77a35b5b56c5	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4844.45	116214.06	286.97	6884.29	5.923800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.423268	2026-01-12 03:25:57.423268	0.00	0.00	0.0000
3d140158-cc05-4593-ac7e-6df162272a49	ed062451-6c52-4531-8307-77a35b5b56c5	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.80	1783.31	47792.82	42.85	1148.27	2.402500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.431681	2026-01-12 03:25:57.431681	0.00	0.00	0.0000
6c8e4f21-d3ca-4d22-bf5e-7a4f03537b95	2aaf8257-0e76-46e2-bbff-26df2dacec46	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	2549.10	69386.91	137.16	3733.43	5.380500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.456306	2026-01-12 03:25:57.456306	0.00	0.00	0.0000
4e3c8530-fabf-45f9-bef5-f02a5010a17e	2aaf8257-0e76-46e2-bbff-26df2dacec46	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	9487.12	227599.92	412.61	9898.54	4.349000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.465042	2026-01-12 03:25:57.465042	0.00	0.00	0.0000
32f3db08-93ce-4b79-b3c3-6ee4445b2888	2aaf8257-0e76-46e2-bbff-26df2dacec46	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	16329.70	443677.75	3.68	100.02	0.022500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.473501	2026-01-12 03:25:57.473501	0.00	0.00	0.0000
c40fa4ea-2926-40ec-a063-2f68144cbbfb	de8808b5-e010-456a-ba30-6ab3854f1f32	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	243.95	6657.59	9.88	269.62	4.049800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.498293	2026-01-12 03:25:57.498293	0.00	0.00	0.0000
3eff11bc-b1b3-4526-9cff-20ecea548b6f	de8808b5-e010-456a-ba30-6ab3854f1f32	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2796.36	67085.24	153.52	3682.87	5.489800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.506648	2026-01-12 03:25:57.506648	0.00	0.00	0.0000
438d8887-a932-49e0-b364-fa11105e7008	de8808b5-e010-456a-ba30-6ab3854f1f32	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.09	1108.80	30037.47	26.83	726.79	2.419600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.515041	2026-01-12 03:25:57.515041	0.00	0.00	0.0000
02cc9548-0ce1-4715-b5d5-cda22e6e5524	70bada6c-aeda-4b4e-a3ff-c6d7abc2188c	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.59	739.14	19654.08	21.53	572.45	2.912600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.53988	2026-01-12 03:25:57.53988	0.00	0.00	0.0000
58ef8997-67c7-45cf-8496-1738da466a9e	70bada6c-aeda-4b4e-a3ff-c6d7abc2188c	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5000.57	119967.53	116.07	2784.49	2.321000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.548322	2026-01-12 03:25:57.548322	0.00	0.00	0.0000
1aee7595-9c30-4663-8a2c-6ae6771583e0	70bada6c-aeda-4b4e-a3ff-c6d7abc2188c	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.556753	2026-01-12 03:25:57.556753	0.00	0.00	0.0000
c4381fa5-287e-4cff-93c1-ea3d70396ffb	9eac0cc3-a529-4c76-a0be-1894a752c1ca	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	3822.93	104060.75	177.11	4820.88	4.632700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.58167	2026-01-12 03:25:57.58167	0.00	0.00	0.0000
63a7c67b-1893-4a6f-bd7a-0c257cf68600	9eac0cc3-a529-4c76-a0be-1894a752c1ca	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10509.72	252131.95	409.72	9829.01	3.898300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.590093	2026-01-12 03:25:57.590093	0.00	0.00	0.0000
e3bc5ffd-e3c2-402d-a7ae-ab0c795afb1b	9eac0cc3-a529-4c76-a0be-1894a752c1ca	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	565.81	15373.07	89.07	2419.99	15.741700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.598089	2026-01-12 03:25:57.598089	0.00	0.00	0.0000
1d0e76b8-7fe2-43c4-b954-0f883c105305	7e3b1490-0bcc-4c0a-9309-ba33e67687d7	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.624631	2026-01-12 03:25:57.624631	0.00	0.00	0.0000
f8ed9e55-5368-4dad-9398-954cde00f629	7e3b1490-0bcc-4c0a-9309-ba33e67687d7	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8144.38	199457.38	423.76	10377.87	5.203000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.631713	2026-01-12 03:25:57.631713	0.00	0.00	0.0000
f2ad700f-a8c4-488d-9f78-78c0e016f493	7e3b1490-0bcc-4c0a-9309-ba33e67687d7	5673f079-eac8-4a64-b47c-ebcfcbb85c31	25.99	3445.55	89549.95	21.17	550.14	0.614300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.640069	2026-01-12 03:25:57.640069	0.00	0.00	0.0000
eb931c5b-1f52-429a-bfb4-4da873ae79e1	c64c03ae-80f7-43ea-9adb-439af7f91c4b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	962.04	25878.96	6.87	184.89	0.714400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.665071	2026-01-12 03:25:57.665071	0.00	0.00	0.0000
e4b9c6eb-875b-4323-8a3f-647923622d1b	c64c03ae-80f7-43ea-9adb-439af7f91c4b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	2172.65	52122.72	23.29	558.60	1.071700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.673398	2026-01-12 03:25:57.673398	0.00	0.00	0.0000
52dff808-6184-45a9-9f06-58fb10818ec7	c64c03ae-80f7-43ea-9adb-439af7f91c4b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.681645	2026-01-12 03:25:57.681645	0.00	0.00	0.0000
1deda99a-77ec-4f90-948b-3e5f94e0b6dc	31bf0d28-13ac-4432-8661-8d3014ac14e2	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.29	346.37	9106.49	25.66	674.59	7.407700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.706421	2026-01-12 03:25:57.706421	0.00	0.00	0.0000
ca4ce2fc-5ce1-45e0-9cf5-101305ef6027	31bf0d28-13ac-4432-8661-8d3014ac14e2	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5719.28	137205.56	272.34	6533.41	4.761700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.714751	2026-01-12 03:25:57.714751	0.00	0.00	0.0000
0f23548f-d191-49b2-98ab-39c8af0b801b	31bf0d28-13ac-4432-8661-8d3014ac14e2	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	1529.49	40669.13	22.59	600.55	1.476600	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.723315	2026-01-12 03:25:57.723315	0.00	0.00	0.0000
682ade42-7a44-4d5d-936c-304e4c2c134a	1be4e3e8-8645-486e-8f3f-517792c4fd5b	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3922.48	105868.43	267.82	7228.38	6.827700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.748544	2026-01-12 03:25:57.748544	0.00	0.00	0.0000
93a63e52-39c7-4ce2-9cdd-cb73f14e937d	1be4e3e8-8645-486e-8f3f-517792c4fd5b	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5494.76	131820.29	213.82	5129.61	3.891300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.756752	2026-01-12 03:25:57.756752	0.00	0.00	0.0000
e1a5b1aa-2212-4b4a-93a8-e7f370eb89d5	1be4e3e8-8645-486e-8f3f-517792c4fd5b	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.59	11460.00	304721.79	65.79	1749.27	0.574000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.764971	2026-01-12 03:25:57.764971	0.00	0.00	0.0000
54736172-2768-4ba5-8c2a-7d743fd1d757	71268683-d08e-40f1-89da-64baa75cac1a	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.89	1723.98	46357.63	67.68	1820.00	3.925900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.790025	2026-01-12 03:25:57.790025	0.00	0.00	0.0000
9f0f0576-1a6e-4a22-80b9-b4edafaf7b9f	71268683-d08e-40f1-89da-64baa75cac1a	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	7620.49	182820.05	248.20	5954.17	3.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.798394	2026-01-12 03:25:57.798394	0.00	0.00	0.0000
741b786f-b63f-436f-b553-1f89b9be1b39	71268683-d08e-40f1-89da-64baa75cac1a	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.806981	2026-01-12 03:25:57.806981	0.00	0.00	0.0000
4c3059c4-27fd-46c5-8565-64ece92fa6fd	a3bfc738-42a1-410b-b6de-19fc7fc15967	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.29	322.00	8787.38	12.12	330.70	3.763300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.83179	2026-01-12 03:25:57.83179	0.00	0.00	0.0000
c3144157-95a0-47eb-baff-001bad8da31f	a3bfc738-42a1-410b-b6de-19fc7fc15967	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	1420.88	34087.92	31.41	753.43	2.210200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.840077	2026-01-12 03:25:57.840077	0.00	0.00	0.0000
c2276613-a1c5-4b16-be8c-7ed7ec04503a	a3bfc738-42a1-410b-b6de-19fc7fc15967	5673f079-eac8-4a64-b47c-ebcfcbb85c31	0.00	0.00	0.00	0.00	0.00	0.000000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.848402	2026-01-12 03:25:57.848402	0.00	0.00	0.0000
9671a9da-a0cb-4fe0-aad5-2599d3c7dbdc	94ba22c9-20c4-4b5d-a845-6c554d73f36d	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.99	3128.76	84446.29	171.60	4631.54	5.484500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.873274	2026-01-12 03:25:57.873274	0.00	0.00	0.0000
b0f036b2-866d-40b5-8826-552f4a4a6208	94ba22c9-20c4-4b5d-a845-6c554d73f36d	a8e9ece3-c380-495c-b76e-713d7e322e98	24.49	8228.94	201527.80	368.89	9034.20	4.482800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.881803	2026-01-12 03:25:57.881803	0.00	0.00	0.0000
004ed53e-18d5-40ce-a5de-2b8836cd7942	94ba22c9-20c4-4b5d-a845-6c554d73f36d	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.49	624.55	17169.07	21.32	585.98	3.412900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.890245	2026-01-12 03:25:57.890245	0.00	0.00	0.0000
84a7e923-171b-47bb-ac29-39d01ee06ac3	5c82ac6c-ffec-43b5-9e98-074f6e5fa9f8	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.92	1393.98	37524.89	99.22	2671.00	7.117900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.915113	2026-01-12 03:25:57.915113	0.00	0.00	0.0000
cc0e8c38-090e-4559-a1da-daa745e2dd62	5c82ac6c-ffec-43b5-9e98-074f6e5fa9f8	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4873.40	116903.03	245.23	5883.07	5.032400	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.923413	2026-01-12 03:25:57.923413	0.00	0.00	0.0000
75238746-7d67-43e0-848e-e3475b3dbefd	5c82ac6c-ffec-43b5-9e98-074f6e5fa9f8	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	520.05	14140.04	13.14	357.22	2.526300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.931737	2026-01-12 03:25:57.931737	0.00	0.00	0.0000
d30b9166-0155-47b8-a601-5e29e48630ea	9825b258-b34c-4c95-8505-803cea551381	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	1872.69	50375.56	154.63	4159.44	8.256800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.956471	2026-01-12 03:25:57.956471	0.00	0.00	0.0000
4547723f-3378-43f3-aa51-6269e96d4e6f	9825b258-b34c-4c95-8505-803cea551381	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	4786.86	114832.98	227.94	5468.29	4.761900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.965233	2026-01-12 03:25:57.965233	0.00	0.00	0.0000
d09c9725-1800-45b1-9ad4-99d6a2b22d62	9825b258-b34c-4c95-8505-803cea551381	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	360.75	9808.77	29.79	809.91	8.256900	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.973306	2026-01-12 03:25:57.973306	0.00	0.00	0.0000
fa764808-1f3d-49a4-b76d-1d98dd6decca	2688379b-c593-4c48-b36e-2be9c33926e3	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	27.22	1009.92	27490.16	60.15	1637.37	5.956200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:57.998368	2026-01-12 03:25:57.998368	0.00	0.00	0.0000
3c1ff042-a3db-4058-8826-abdf50b85f5e	2688379b-c593-4c48-b36e-2be9c33926e3	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	3278.98	78663.34	153.74	3688.18	4.688500	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.006715	2026-01-12 03:25:58.006715	0.00	0.00	0.0000
afbf04a6-0db7-4165-92ca-9e61512e3597	2688379b-c593-4c48-b36e-2be9c33926e3	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.17	9284.95	252272.53	88.89	2415.08	0.957300	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.015121	2026-01-12 03:25:58.015121	0.00	0.00	0.0000
de2b9b52-f96e-4b70-8dcf-7037e9e85f4a	c42418b5-5c4c-455b-aaa6-789b21b1aefa	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	25.88	1660.20	42966.26	133.78	3462.25	8.058000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.040137	2026-01-12 03:25:58.040137	0.00	0.00	0.0000
d0f49949-8155-44d5-bb6c-4be259d8fe23	c42418b5-5c4c-455b-aaa6-789b21b1aefa	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	5015.58	120323.15	185.22	4443.33	3.692800	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.048184	2026-01-12 03:25:58.048184	0.00	0.00	0.0000
33177cdf-8a59-4eb8-8f85-49d0dbecc25e	3c825894-bbf7-46c1-b285-20721b85f3a6	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	8040.61	192897.39	396.64	9515.24	4.932700	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.090195	2026-01-12 03:25:58.090195	0.00	0.00	0.0000
735b9d5f-dc52-4c4f-86a8-76c03aa70446	3c825894-bbf7-46c1-b285-20721b85f3a6	5673f079-eac8-4a64-b47c-ebcfcbb85c31	26.12	925.14	24164.59	167.47	4374.33	18.102200	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2026-01-12 03:25:58.098413	2026-01-12 03:25:58.098413	0.00	0.00	0.0000
e6c13c7f-9a35-44ee-8855-88bca2bac0e9	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	cc685ee6-27ad-465d-9ecc-1a7abe8809ba	26.90	3161.71	85050.00	168.43	4530.91	5.327100	11582.00	0.00	0.00	0.00	0.00	0.00	8420.29	8588.00	2026-01-12 03:28:12.568564	2026-01-12 03:28:12.568564	167.71	4511.40	5.3044
0227515c-139f-4f97-8b79-f2b5c984451d	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	a8e9ece3-c380-495c-b76e-713d7e322e98	23.99	10174.48	244085.78	509.83	12230.65	5.010600	42683.00	0.00	0.00	0.00	0.00	0.00	32508.52	33016.00	2026-01-12 03:28:12.577174	2026-01-12 03:28:12.577174	507.48	12174.45	4.9878
ae65dd56-0b7b-4145-8ae6-e81a29f10f92	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	5673f079-eac8-4a64-b47c-ebcfcbb85c31	27.19	641.76	17449.45	16.91	459.67	2.634300	40507.00	0.00	0.00	0.00	0.00	0.00	39865.24	39882.00	2026-01-12 03:28:12.585531	2026-01-12 03:28:12.585531	16.76	455.70	2.6116
\.


--
-- Data for Name: reportes; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.reportes (id, estacion_id, fecha, aceites, estado, creado_por, revisado_por, fecha_creacion, fecha_revision, comentarios, created_at, updated_at) FROM stdin;
f4c64294-6b23-438b-94df-a9f15c2e68f2	bc7074e5-4b10-4968-9f4b-2fa9c02a0e0a	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.561369	\N	\N	2026-01-11 20:07:06.561369	2026-01-11 20:07:06.561369
da9d115e-3bda-4009-bc9d-a102d8080407	e86fda90-38c9-450a-bc1c-f398eb2f087a	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.605801	\N	\N	2026-01-11 20:07:06.605801	2026-01-11 20:07:06.605801
d2b89476-9d69-4697-a0f3-a1f8d2fd7bca	c390d434-9260-4e69-9bc1-05c10b8daa38	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.639456	\N	\N	2026-01-11 20:07:06.639456	2026-01-11 20:07:06.639456
73c86f61-cbee-4db9-8c4d-6f616e3cb81c	ddcd60ff-75b1-4ed9-9700-cdb9e36bcd64	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.704214	\N	\N	2026-01-11 20:07:06.704214	2026-01-11 20:07:06.704214
5cd7623d-0433-429b-86d4-75d91502931d	f92dfa28-b2e1-46f0-a978-b81ee9fec785	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.739461	\N	\N	2026-01-11 20:07:06.739461	2026-01-11 20:07:06.739461
4d06564a-9901-43bb-90c3-c128358bf99a	11a55b89-2ce7-4248-87f8-8c59a8f18330	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.773009	\N	\N	2026-01-11 20:07:06.773009	2026-01-11 20:07:06.773009
b57ad658-f1a4-419b-b7d7-23c0dc4609c2	64e68d24-2370-477f-97b7-59f1617013ff	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.814701	\N	\N	2026-01-11 20:07:06.814701	2026-01-11 20:07:06.814701
965aa11a-7ab1-4c18-9085-5bc53b3fd1c9	dccaab02-3e55-4c5b-94a3-0c34b6202f62	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.847934	\N	\N	2026-01-11 20:07:06.847934	2026-01-11 20:07:06.847934
4d298c09-f5c8-44be-8882-edccd277b629	7c26f913-b308-48d0-9a92-514aba4c4ce2	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.881257	\N	\N	2026-01-11 20:07:06.881257	2026-01-11 20:07:06.881257
df3390b7-d839-410d-b1b7-9acc39a0b4ed	738238d9-25cd-4f00-a191-abfde4e9bed6	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.914636	\N	\N	2026-01-11 20:07:06.914636	2026-01-11 20:07:06.914636
32804d75-386f-4656-bcb1-af3ab5cd8e56	041b42ac-770c-4042-a26f-9f3f7952d990	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.949729	\N	\N	2026-01-11 20:07:06.949729	2026-01-11 20:07:06.949729
d93f9fde-8985-4108-9b85-3a2200fab7f6	8f83082c-b547-4ae0-bdec-323ba98933f8	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:06.989274	\N	\N	2026-01-11 20:07:06.989274	2026-01-11 20:07:06.989274
f3e86034-1259-4ccf-872d-54e36ab29131	d00edd18-e375-4553-bbf3-e4a524d4b0ac	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.022938	\N	\N	2026-01-11 20:07:07.022938	2026-01-11 20:07:07.022938
49c902e2-32d9-49d6-8b1e-e23a4cf9c35b	28ad3580-8061-4a6d-8db3-bbe367f54058	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.056401	\N	\N	2026-01-11 20:07:07.056401	2026-01-11 20:07:07.056401
02c68d58-2dca-421a-8c89-8c06f5107565	5e1cef33-0274-4863-b6ef-348bc2a9216e	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.087766	\N	\N	2026-01-11 20:07:07.087766	2026-01-11 20:07:07.087766
c82240a4-d93e-43f4-a756-b43abc2799dc	14f77980-3e47-4f46-a0ce-36721666bee4	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.123019	\N	\N	2026-01-11 20:07:07.123019	2026-01-11 20:07:07.123019
2f7207ce-745e-439f-bc1d-11b46fd124e0	70c9e2b3-65a3-4e41-a437-2c5a0b05e15d	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.156499	\N	\N	2026-01-11 20:07:07.156499	2026-01-11 20:07:07.156499
3aef4e67-5e45-4c9b-b536-d420a7683766	9e944584-a75c-474a-8faa-6d8a9a39b734	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.189656	\N	\N	2026-01-11 20:07:07.189656	2026-01-11 20:07:07.189656
4d468d1e-86a2-4c2a-8d69-fa0de598e39f	4784eb45-e611-48d2-9cfd-af51e885d671	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.22283	\N	\N	2026-01-11 20:07:07.22283	2026-01-11 20:07:07.22283
4d57c19a-37c2-4b18-b2c1-1926d925e768	198d0d56-2e88-4ecc-9403-de4fda41624c	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.255831	\N	\N	2026-01-11 20:07:07.255831	2026-01-11 20:07:07.255831
018dad9e-70f2-4054-9c14-66be0cc906fc	7b014b00-fbd9-4c83-bde3-0ee332d40cc6	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.287121	\N	\N	2026-01-11 20:07:07.287121	2026-01-11 20:07:07.287121
23c2375c-0e0f-47af-bcca-f3425aba1436	3d0aa232-8b6a-4155-9b94-b47fd219292a	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.323471	\N	\N	2026-01-11 20:07:07.323471	2026-01-11 20:07:07.323471
e309da19-4062-4b8b-bd0a-c43d99a71258	45f22cd5-016a-4d04-8dc2-c62eb1df9a3c	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.356272	\N	\N	2026-01-11 20:07:07.356272	2026-01-11 20:07:07.356272
d9f4590c-6d9a-4183-9fa3-66758e234723	54c0cde6-fc6c-4b68-be01-824eff420b27	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.389577	\N	\N	2026-01-11 20:07:07.389577	2026-01-11 20:07:07.389577
d757f1b3-21ac-44d4-88b4-14da77974d6c	8443fc94-4834-49bc-a4fd-a830ae2305d9	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.422982	\N	\N	2026-01-11 20:07:07.422982	2026-01-11 20:07:07.422982
d0e9c644-0453-4761-8491-28a4ae648950	560e8137-619c-4d86-8ada-d8f53764be3d	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.456135	\N	\N	2026-01-11 20:07:07.456135	2026-01-11 20:07:07.456135
998a61e3-6d58-4fb8-b388-71167311063a	b3c2dc63-ce92-4218-91f1-0b9ce3a50d6a	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.489655	\N	\N	2026-01-11 20:07:07.489655	2026-01-11 20:07:07.489655
1af3e72d-5660-4782-998c-3c67f3c2cece	3be3f6fe-ea62-4375-9a5a-2b35b33e7a71	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.523031	\N	\N	2026-01-11 20:07:07.523031	2026-01-11 20:07:07.523031
6b4e6e87-b9a0-439d-a35f-862aed10624d	b60f4736-5754-458f-b980-a635ce77b6b0	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.554658	\N	\N	2026-01-11 20:07:07.554658	2026-01-11 20:07:07.554658
6ae73016-7324-4791-8300-bd0ea229de4d	efef6cc9-f70b-4764-8ec4-db630476f0c6	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.589662	\N	\N	2026-01-11 20:07:07.589662	2026-01-11 20:07:07.589662
62531d50-d8b9-4d1c-b279-31343fb446b5	a9e5196d-ce0b-401f-b4ec-fab3b0e169a7	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.623045	\N	\N	2026-01-11 20:07:07.623045	2026-01-11 20:07:07.623045
cf53b89f-7a94-409b-8ab0-d1fa7691879b	3c8f2e28-60d2-408a-8445-75484d60844f	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.656264	\N	\N	2026-01-11 20:07:07.656264	2026-01-11 20:07:07.656264
737cf76e-b65c-43fb-85da-d4db085dc7cc	9792eed5-77a4-48e6-9ccb-6026fa8f28f3	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.689813	\N	\N	2026-01-11 20:07:07.689813	2026-01-11 20:07:07.689813
22a4dbd8-aa0b-4f04-a0a8-3a07c89ddcd1	4a211954-7527-4f93-a92d-e133feb11d87	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.723253	\N	\N	2026-01-11 20:07:07.723253	2026-01-11 20:07:07.723253
eb077861-3689-4aad-a590-dde6a281ce0c	8122ef0e-2b39-473c-8467-0efdcabb66b0	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.756545	\N	\N	2026-01-11 20:07:07.756545	2026-01-11 20:07:07.756545
80eab7aa-4c78-4362-a698-f5d46192a371	31ee5f60-ce34-418d-852b-89ed873dc1f5	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.78981	\N	\N	2026-01-11 20:07:07.78981	2026-01-11 20:07:07.78981
b7419105-c188-4dce-9a0a-7e7e66a00cba	38def561-e6c2-409f-85eb-a4314b3cda17	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.82317	\N	\N	2026-01-11 20:07:07.82317	2026-01-11 20:07:07.82317
64522954-bc5f-41f6-8987-00fe6a50ec7a	6991571b-3fc4-4ec0-9744-c7949583b046	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.856538	\N	\N	2026-01-11 20:07:07.856538	2026-01-11 20:07:07.856538
3d0782db-68f7-4459-a644-a0b6237e4e89	0d4ab4b0-e579-4ce3-b512-8efe56b59ef7	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.887994	\N	\N	2026-01-11 20:07:07.887994	2026-01-11 20:07:07.887994
15d2ab92-5137-4759-b217-abcf95afd958	dfb60f00-5227-4349-9517-1168b5a200ae	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.92296	\N	\N	2026-01-11 20:07:07.92296	2026-01-11 20:07:07.92296
8950563e-032b-4805-a5ab-e93388b3c160	cd01e992-d9ee-40f7-aa13-4a5030ea6de8	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.956551	\N	\N	2026-01-11 20:07:07.956551	2026-01-11 20:07:07.956551
b2ddb4f5-572b-43e2-9be2-56f61a923804	7f555243-cf16-44ec-bfec-14ec1702709e	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:07.990029	\N	\N	2026-01-11 20:07:07.990029	2026-01-11 20:07:07.990029
0c35f8f6-db20-46b9-b53e-1d0f9b73caa3	90a866be-f398-474d-a219-24d5f271c97e	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.023501	\N	\N	2026-01-11 20:07:08.023501	2026-01-11 20:07:08.023501
4fcd471b-245a-4d94-b5fd-d749d4fd0ac8	f5126840-9259-4026-acfb-d1b7219136cc	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.05665	\N	\N	2026-01-11 20:07:08.05665	2026-01-11 20:07:08.05665
61578f67-e7e3-4b98-a814-b88311a686cc	fbc0adeb-5fb5-46fc-be71-3323a9e66c2c	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.089816	\N	\N	2026-01-11 20:07:08.089816	2026-01-11 20:07:08.089816
80817f6d-0c11-4031-9d56-5bb77cf9ef1d	398fa6be-7991-4fa8-bd11-99db2ed0b52a	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.123273	\N	\N	2026-01-11 20:07:08.123273	2026-01-11 20:07:08.123273
d1366d81-0a4e-4dbc-8a78-b35ea819642c	f704818a-fc0b-449a-b701-bdf8f496e44e	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.156662	\N	\N	2026-01-11 20:07:08.156662	2026-01-11 20:07:08.156662
f22a2d3b-ade6-455a-aaef-ba19875e66a8	9768be35-7a8e-4f19-97af-d315ddedbfcf	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.190111	\N	\N	2026-01-11 20:07:08.190111	2026-01-11 20:07:08.190111
74c8553d-a932-4c4d-9477-fa886d16eb7b	00a528bc-1114-4b20-b481-abe74da0c1ff	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.223297	\N	\N	2026-01-11 20:07:08.223297	2026-01-11 20:07:08.223297
2fb32cfc-c529-49c8-bc2a-7fecd4a8023e	103a95df-93a4-49e0-8e23-2c4c1cb6ee39	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.256249	\N	\N	2026-01-11 20:07:08.256249	2026-01-11 20:07:08.256249
f550cb1d-1540-457f-85c7-c20aab8a9647	a158eacc-3524-4ad3-8521-bd2a5207b140	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.290827	\N	\N	2026-01-11 20:07:08.290827	2026-01-11 20:07:08.290827
d28ed581-f73d-440e-b1b3-4f3077797d75	0b11fdd0-2381-41c8-ad1d-6a98a6b18133	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.323489	\N	\N	2026-01-11 20:07:08.323489	2026-01-11 20:07:08.323489
07d3ddcd-6e3d-4385-9f23-3d27ff711cc6	413d893a-79fb-4eed-a606-29bb227361a6	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.35487	\N	\N	2026-01-11 20:07:08.35487	2026-01-11 20:07:08.35487
8c978658-4d6c-44d4-b11d-595c5f482803	c1da10fc-bb68-4233-8f8f-c26b93d2fcd0	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.389845	\N	\N	2026-01-11 20:07:08.389845	2026-01-11 20:07:08.389845
f32af08b-7f85-4a14-88de-25ea9b8891a9	5fbce81f-4611-43ac-afee-2734d0c52c6c	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.423334	\N	\N	2026-01-11 20:07:08.423334	2026-01-11 20:07:08.423334
91382ad1-8959-4271-98f5-1b220c66e9b3	38ee891a-3ba2-40ef-a01e-a800aa64acfe	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.460485	\N	\N	2026-01-11 20:07:08.460485	2026-01-11 20:07:08.460485
4c8af61c-fa48-4ce8-8340-f2965913d5c1	3351e1a4-1ef2-43ae-b936-689fff1661fe	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.498494	\N	\N	2026-01-11 20:07:08.498494	2026-01-11 20:07:08.498494
861796f0-a878-487c-bc18-b01359c48d05	70869a90-c6bb-4a71-8409-81553dbd16b6	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.530128	\N	\N	2026-01-11 20:07:08.530128	2026-01-11 20:07:08.530128
4cced9c7-8881-4088-84a2-a11effaa2772	1038e9aa-c5f0-4483-8b10-58cb79fda86b	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.565104	\N	\N	2026-01-11 20:07:08.565104	2026-01-11 20:07:08.565104
e4397be6-c5a1-4980-b515-a239c75ba9f6	5343f6a2-49db-4408-bce5-68b2278ac202	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.598405	\N	\N	2026-01-11 20:07:08.598405	2026-01-11 20:07:08.598405
5febb256-1ff2-4e93-a15a-424ebd5503eb	9c3176e2-e778-4b79-848a-2b5f9c9550ed	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.631758	\N	\N	2026-01-11 20:07:08.631758	2026-01-11 20:07:08.631758
89e42526-c783-4e3d-bd14-0e0a0e8bab95	91378420-512b-4c0e-a21c-965a9249efc9	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.665171	\N	\N	2026-01-11 20:07:08.665171	2026-01-11 20:07:08.665171
f79cfbc7-9bf6-4940-8111-df01a2d4ef7b	b46042b2-a78f-4e14-905c-25929890ee49	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.697866	\N	\N	2026-01-11 20:07:08.697866	2026-01-11 20:07:08.697866
82ead00a-905f-43a2-9df6-813c5fdb25cf	6a4cccf9-1b62-419f-8cb9-7c32a288780c	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.73124	\N	\N	2026-01-11 20:07:08.73124	2026-01-11 20:07:08.73124
9117f7ca-feda-4487-85ab-5cc4ec304302	5e04d805-17da-48be-a850-f5249ec89a82	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.765032	\N	\N	2026-01-11 20:07:08.765032	2026-01-11 20:07:08.765032
e60466a3-1de2-45d7-91be-6ebfdee63868	6d6610af-b1f6-4408-96fe-ae7b42017f44	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.798434	\N	\N	2026-01-11 20:07:08.798434	2026-01-11 20:07:08.798434
1ad22d08-00c1-40b8-bdbf-ca3d351cb8a4	7a347e96-3ac5-4de3-afd2-62145554d35f	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.831721	\N	\N	2026-01-11 20:07:08.831721	2026-01-11 20:07:08.831721
aa95f422-27ea-4860-aef1-2d4fb0f8c5a8	2fff4e81-4f43-4e60-9ba7-45d013e445f0	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.865042	\N	\N	2026-01-11 20:07:08.865042	2026-01-11 20:07:08.865042
f27e64ab-0e73-42ed-8bc9-dfdfa46b75f0	7b4124c9-7b4e-4e1a-8842-38b123114b57	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.898386	\N	\N	2026-01-11 20:07:08.898386	2026-01-11 20:07:08.898386
e48a6887-da02-4da1-a39a-701464d932e5	eb218f9f-4910-47ff-af1a-9fbc0e102050	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.93188	\N	\N	2026-01-11 20:07:08.93188	2026-01-11 20:07:08.93188
d419b571-43e5-4b6a-aec6-c36c5cdc22ce	93bf467b-5397-4528-b232-133972b43567	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.965104	\N	\N	2026-01-11 20:07:08.965104	2026-01-11 20:07:08.965104
b8f02737-2d59-4287-bab5-92ca6de5a081	1afbd69f-e12b-438b-b5ed-0deb2646f148	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:08.998492	\N	\N	2026-01-11 20:07:08.998492	2026-01-11 20:07:08.998492
3d0c79d7-455e-456b-a8a6-6ba0c096b9ed	711b056b-b683-4433-93f0-2f99ec7b68a6	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:09.031863	\N	\N	2026-01-11 20:07:09.031863	2026-01-11 20:07:09.031863
5cf7c84e-c73a-45ac-a00d-983a97c65fee	a4ec3802-bbac-49d5-b1d1-2ca21f8a3bd5	2025-11-01	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-11 20:07:09.06511	\N	\N	2026-01-11 20:07:09.06511	2026-01-11 20:07:09.06511
7643468d-c7d3-4828-9f73-a66bd581597b	4ede20dd-c902-47bd-892d-7661d0b66f17	2025-11-01	5186.01	Aprobado	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	38057ae0-41a9-48ef-926f-497727e37f07	2026-01-11 20:07:06.67294	2026-01-11 20:34:15.747939	\N	2026-01-11 20:07:06.67294	2026-01-11 20:34:15.747939
40bd6708-060f-46c8-9974-aafefb60e796	c390d434-9260-4e69-9bc1-05c10b8daa38	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:40.867414	\N	\N	2026-01-12 03:16:40.867414	2026-01-12 03:25:54.956815
0f89cf3a-0efb-4278-a5f6-4ea53834cbbe	f92dfa28-b2e1-46f0-a978-b81ee9fec785	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:40.967456	\N	\N	2026-01-12 03:16:40.967456	2026-01-12 03:25:55.08384
9272dd2b-04ca-483b-8fcb-630f853dfe1f	11a55b89-2ce7-4248-87f8-8c59a8f18330	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.000945	\N	\N	2026-01-12 03:16:41.000945	2026-01-12 03:25:55.122924
d63a8e21-041c-4ea1-ba7f-eacbf97560a0	64e68d24-2370-477f-97b7-59f1617013ff	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.03429	\N	\N	2026-01-12 03:16:41.03429	2026-01-12 03:25:55.167316
980a3f22-e598-40e4-a900-c9dcbc9a8398	dccaab02-3e55-4c5b-94a3-0c34b6202f62	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.075824	\N	\N	2026-01-12 03:16:41.075824	2026-01-12 03:25:55.209212
1e1e4bc8-dece-4507-a135-068a1d3eb2be	7c26f913-b308-48d0-9a92-514aba4c4ce2	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.109313	\N	\N	2026-01-12 03:16:41.109313	2026-01-12 03:25:55.250909
c386aea3-2f74-459e-8739-83e19b72de06	738238d9-25cd-4f00-a191-abfde4e9bed6	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.142658	\N	\N	2026-01-12 03:16:41.142658	2026-01-12 03:25:55.292647
531a1506-108f-408a-a338-86d6c2d8e72a	041b42ac-770c-4042-a26f-9f3f7952d990	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.175981	\N	\N	2026-01-12 03:16:41.175981	2026-01-12 03:25:55.334178
56a06068-55b9-44b5-afcd-3abe511d6d12	8f83082c-b547-4ae0-bdec-323ba98933f8	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.209294	\N	\N	2026-01-12 03:16:41.209294	2026-01-12 03:25:55.375895
5d3aa996-1a94-426d-b4e7-32c4916b8929	d00edd18-e375-4553-bbf3-e4a524d4b0ac	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.242467	\N	\N	2026-01-12 03:16:41.242467	2026-01-12 03:25:55.417538
0bdd4c31-786d-4f87-9b0a-4bbdcdc267cc	28ad3580-8061-4a6d-8db3-bbe367f54058	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.276038	\N	\N	2026-01-12 03:16:41.276038	2026-01-12 03:25:55.459227
c48fa837-7a09-4f5f-aeaa-3f704d83ac72	5e1cef33-0274-4863-b6ef-348bc2a9216e	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.309465	\N	\N	2026-01-12 03:16:41.309465	2026-01-12 03:25:55.500878
85e8a0bd-a670-4535-a11b-43acd5930efe	14f77980-3e47-4f46-a0ce-36721666bee4	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.343335	\N	\N	2026-01-12 03:16:41.343335	2026-01-12 03:25:55.542763
9e4b3bf0-1c9e-433a-8b73-ac2b8399351f	70c9e2b3-65a3-4e41-a437-2c5a0b05e15d	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.373558	\N	\N	2026-01-12 03:16:41.373558	2026-01-12 03:25:55.584376
8b07c772-ce2c-482a-90e3-0e26ad5ae058	9e944584-a75c-474a-8faa-6d8a9a39b734	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.407543	\N	\N	2026-01-12 03:16:41.407543	2026-01-12 03:25:55.626051
6a508c12-e8bb-4b1f-a69e-e072e066fc1f	4784eb45-e611-48d2-9cfd-af51e885d671	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.440481	\N	\N	2026-01-12 03:16:41.440481	2026-01-12 03:25:55.667704
af3410be-f5f0-4ed5-96ad-e42f53251dbd	7b014b00-fbd9-4c83-bde3-0ee332d40cc6	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.508904	\N	\N	2026-01-12 03:16:41.508904	2026-01-12 03:25:55.751111
63d72846-350d-42ab-9e67-20d630cd9bd8	3d0aa232-8b6a-4155-9b94-b47fd219292a	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.543495	\N	\N	2026-01-12 03:16:41.543495	2026-01-12 03:25:55.834516
ba58fbca-dc78-4367-b81d-87752fb4f006	45f22cd5-016a-4d04-8dc2-c62eb1df9a3c	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.575242	\N	\N	2026-01-12 03:16:41.575242	2026-01-12 03:25:55.874217
134a8ddf-0a97-4f90-91f4-493292c31942	54c0cde6-fc6c-4b68-be01-824eff420b27	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.606596	\N	\N	2026-01-12 03:16:41.606596	2026-01-12 03:25:55.917569
9c80572a-cffc-4723-8046-e92e863704d9	8443fc94-4834-49bc-a4fd-a830ae2305d9	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.640436	\N	\N	2026-01-12 03:16:41.640436	2026-01-12 03:25:55.959501
cf34c088-268b-44b3-99df-32ee068e1590	560e8137-619c-4d86-8ada-d8f53764be3d	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.675776	\N	\N	2026-01-12 03:16:41.675776	2026-01-12 03:25:56.001178
adc0fff9-e570-40f0-926e-38e2730e66ee	b3c2dc63-ce92-4218-91f1-0b9ce3a50d6a	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.709185	\N	\N	2026-01-12 03:16:41.709185	2026-01-12 03:25:56.042744
dd66f407-475a-418b-aaff-0b7c9d6277c2	3be3f6fe-ea62-4375-9a5a-2b35b33e7a71	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.742757	\N	\N	2026-01-12 03:16:41.742757	2026-01-12 03:25:56.084595
e2e7437d-cef2-41df-9a75-6454eb18f6f7	b60f4736-5754-458f-b980-a635ce77b6b0	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.776029	\N	\N	2026-01-12 03:16:41.776029	2026-01-12 03:25:56.126163
862159e9-d9ca-4ecd-9285-c09b5ba4a638	efef6cc9-f70b-4764-8ec4-db630476f0c6	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.809176	\N	\N	2026-01-12 03:16:41.809176	2026-01-12 03:25:56.167931
e1d03885-0bed-4fd8-a157-94c569f2de6c	a9e5196d-ce0b-401f-b4ec-fab3b0e169a7	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.842637	\N	\N	2026-01-12 03:16:41.842637	2026-01-12 03:25:56.209499
b29b5077-bf66-450e-8097-e231178617dc	e86fda90-38c9-450a-bc1c-f398eb2f087a	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:40.833817	\N	\N	2026-01-12 03:16:40.833817	2026-01-12 03:25:54.917659
a2d733f2-995c-4f6d-aec3-695bae0f8f53	4a211954-7527-4f93-a92d-e133feb11d87	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.942669	\N	\N	2026-01-12 03:16:41.942669	2026-01-12 03:25:56.334552
4630d23c-6da6-4a74-97a2-ed094a968b88	8122ef0e-2b39-473c-8467-0efdcabb66b0	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.975667	\N	\N	2026-01-12 03:16:41.975667	2026-01-12 03:25:56.376176
65c0350b-231e-4c9f-9d82-616339967be2	31ee5f60-ce34-418d-852b-89ed873dc1f5	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.009336	\N	\N	2026-01-12 03:16:42.009336	2026-01-12 03:25:56.417494
c65f258f-7717-4a59-901c-e2ea8e73395a	38def561-e6c2-409f-85eb-a4314b3cda17	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.04275	\N	\N	2026-01-12 03:16:42.04275	2026-01-12 03:25:56.459558
b6de1f52-e3c6-4f5f-8aed-f06abdde75c2	0d4ab4b0-e579-4ce3-b512-8efe56b59ef7	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.109484	\N	\N	2026-01-12 03:16:42.109484	2026-01-12 03:25:56.542815
3dca0f19-885c-401d-a814-9c87a87c4077	dfb60f00-5227-4349-9517-1168b5a200ae	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.142783	\N	\N	2026-01-12 03:16:42.142783	2026-01-12 03:25:56.584409
6de5f1fd-6d50-493b-b395-cfafba67ec2b	cd01e992-d9ee-40f7-aa13-4a5030ea6de8	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.176054	\N	\N	2026-01-12 03:16:42.176054	2026-01-12 03:25:56.626151
0f0e63dc-00aa-4686-bf52-feffc1d33bf5	7f555243-cf16-44ec-bfec-14ec1702709e	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.209482	\N	\N	2026-01-12 03:16:42.209482	2026-01-12 03:25:56.667745
4030d7ac-031e-45a8-98b5-c9b7c33b5b21	90a866be-f398-474d-a219-24d5f271c97e	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.242318	\N	\N	2026-01-12 03:16:42.242318	2026-01-12 03:25:56.709673
5cec217f-e4c3-4554-9b87-f7cfd5e46fae	f5126840-9259-4026-acfb-d1b7219136cc	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.276112	\N	\N	2026-01-12 03:16:42.276112	2026-01-12 03:25:56.75119
edef6d77-69cf-4e97-a194-73a40baf2011	fbc0adeb-5fb5-46fc-be71-3323a9e66c2c	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.310125	\N	\N	2026-01-12 03:16:42.310125	2026-01-12 03:25:56.793065
184dc0bb-2d21-477c-b796-c9901d8cd724	398fa6be-7991-4fa8-bd11-99db2ed0b52a	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.342492	\N	\N	2026-01-12 03:16:42.342492	2026-01-12 03:25:56.834313
2ba6d707-c06e-4432-bb30-38cb5482b2a6	f704818a-fc0b-449a-b701-bdf8f496e44e	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.376135	\N	\N	2026-01-12 03:16:42.376135	2026-01-12 03:25:56.876349
1febbd38-2494-41fa-a41c-111bc696df32	9768be35-7a8e-4f19-97af-d315ddedbfcf	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.407251	\N	\N	2026-01-12 03:16:42.407251	2026-01-12 03:25:56.917974
5d1924c9-97b8-4f9e-9af1-c9b62b2c8293	00a528bc-1114-4b20-b481-abe74da0c1ff	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.441944	\N	\N	2026-01-12 03:16:42.441944	2026-01-12 03:25:56.95761
52b1ac74-8bdc-474b-b2ee-972dcc61d1f1	103a95df-93a4-49e0-8e23-2c4c1cb6ee39	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.476321	\N	\N	2026-01-12 03:16:42.476321	2026-01-12 03:25:57.026115
690117a1-a139-4fa0-8b8b-6869a13f94d7	a158eacc-3524-4ad3-8521-bd2a5207b140	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.509744	\N	\N	2026-01-12 03:16:42.509744	2026-01-12 03:25:57.067848
5e37dfd6-2647-4c49-80f5-2a4bf39a0e2c	0b11fdd0-2381-41c8-ad1d-6a98a6b18133	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.543133	\N	\N	2026-01-12 03:16:42.543133	2026-01-12 03:25:57.109763
c6e21930-116d-40b2-a887-b49f5f93fafa	efe73bef-f6ed-436c-9f53-ee6f2561b276	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.609761	\N	\N	2026-01-12 03:16:42.609761	2026-01-12 03:25:57.191523
51652ca4-af33-4f91-bd31-f812693f7197	c1da10fc-bb68-4233-8f8f-c26b93d2fcd0	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.643104	\N	\N	2026-01-12 03:16:42.643104	2026-01-12 03:25:57.231934
b9e71281-71e7-4d82-88cf-13ec3785ff06	5fbce81f-4611-43ac-afee-2734d0c52c6c	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.67639	\N	\N	2026-01-12 03:16:42.67639	2026-01-12 03:25:57.273443
da3a759b-66d0-4765-99d3-4dd458844638	38ee891a-3ba2-40ef-a01e-a800aa64acfe	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.709749	\N	\N	2026-01-12 03:16:42.709749	2026-01-12 03:25:57.317862
591e5b94-fe0c-41c8-b8a3-4149957bddba	3351e1a4-1ef2-43ae-b936-689fff1661fe	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.743008	\N	\N	2026-01-12 03:16:42.743008	2026-01-12 03:25:57.359376
ed062451-6c52-4531-8307-77a35b5b56c5	70869a90-c6bb-4a71-8409-81553dbd16b6	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.776197	\N	\N	2026-01-12 03:16:42.776197	2026-01-12 03:25:57.401494
2aaf8257-0e76-46e2-bbff-26df2dacec46	1038e9aa-c5f0-4483-8b10-58cb79fda86b	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.834828	\N	\N	2026-01-12 03:16:42.834828	2026-01-12 03:25:57.44316
de8808b5-e010-456a-ba30-6ab3854f1f32	5343f6a2-49db-4408-bce5-68b2278ac202	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.868135	\N	\N	2026-01-12 03:16:42.868135	2026-01-12 03:25:57.484818
70bada6c-aeda-4b4e-a3ff-c6d7abc2188c	9c3176e2-e778-4b79-848a-2b5f9c9550ed	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.901045	\N	\N	2026-01-12 03:16:42.901045	2026-01-12 03:25:57.526387
9eac0cc3-a529-4c76-a0be-1894a752c1ca	91378420-512b-4c0e-a21c-965a9249efc9	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.934364	\N	\N	2026-01-12 03:16:42.934364	2026-01-12 03:25:57.568056
7e3b1490-0bcc-4c0a-9309-ba33e67687d7	b46042b2-a78f-4e14-905c-25929890ee49	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.96629	\N	\N	2026-01-12 03:16:42.96629	2026-01-12 03:25:57.609776
c64c03ae-80f7-43ea-9adb-439af7f91c4b	6a4cccf9-1b62-419f-8cb9-7c32a288780c	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.001431	\N	\N	2026-01-12 03:16:43.001431	2026-01-12 03:25:57.651526
31bf0d28-13ac-4432-8661-8d3014ac14e2	5e04d805-17da-48be-a850-f5249ec89a82	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.034943	\N	\N	2026-01-12 03:16:43.034943	2026-01-12 03:25:57.69308
1be4e3e8-8645-486e-8f3f-517792c4fd5b	6d6610af-b1f6-4408-96fe-ae7b42017f44	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.068131	\N	\N	2026-01-12 03:16:43.068131	2026-01-12 03:25:57.73486
71268683-d08e-40f1-89da-64baa75cac1a	7a347e96-3ac5-4de3-afd2-62145554d35f	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.101358	\N	\N	2026-01-12 03:16:43.101358	2026-01-12 03:25:57.776432
94ba22c9-20c4-4b5d-a845-6c554d73f36d	7b4124c9-7b4e-4e1a-8842-38b123114b57	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.168219	\N	\N	2026-01-12 03:16:43.168219	2026-01-12 03:25:57.85984
5c82ac6c-ffec-43b5-9e98-074f6e5fa9f8	eb218f9f-4910-47ff-af1a-9fbc0e102050	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.201738	\N	\N	2026-01-12 03:16:43.201738	2026-01-12 03:25:57.9015
9825b258-b34c-4c95-8505-803cea551381	93bf467b-5397-4528-b232-133972b43567	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.234954	\N	\N	2026-01-12 03:16:43.234954	2026-01-12 03:25:57.943166
2688379b-c593-4c48-b36e-2be9c33926e3	1afbd69f-e12b-438b-b5ed-0deb2646f148	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.268346	\N	\N	2026-01-12 03:16:43.268346	2026-01-12 03:25:57.98482
c42418b5-5c4c-455b-aaa6-789b21b1aefa	711b056b-b683-4433-93f0-2f99ec7b68a6	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.301549	\N	\N	2026-01-12 03:16:43.301549	2026-01-12 03:25:58.026425
3c825894-bbf7-46c1-b285-20721b85f3a6	a4ec3802-bbac-49d5-b1d1-2ca21f8a3bd5	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.332611	\N	\N	2026-01-12 03:16:43.332611	2026-01-12 03:25:58.06818
c26ea08d-2fdc-4503-89ec-eea6eec6171e	bc7074e5-4b10-4968-9f4b-2fa9c02a0e0a	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:40.785944	\N	\N	2026-01-12 03:16:40.785944	2026-01-12 03:25:54.865546
010afafb-4045-4fbe-b6b4-e9bfb109fae8	9792eed5-77a4-48e6-9ccb-6026fa8f28f3	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.909551	\N	\N	2026-01-12 03:16:41.909551	2026-01-12 03:25:56.292815
d0985673-8920-473d-b752-27c032820b3c	ddcd60ff-75b1-4ed9-9700-cdb9e36bcd64	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:40.934273	\N	\N	2026-01-12 03:16:40.934273	2026-01-12 03:25:55.042135
cfbd63e3-510d-4ea6-a87a-3f9eb61ed1c2	198d0d56-2e88-4ecc-9403-de4fda41624c	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.475725	\N	\N	2026-01-12 03:16:41.475725	2026-01-12 03:25:55.709352
b8ab2048-d945-4ed8-9c09-7f701f4d7001	042f9c57-30ce-4847-96d1-c00c57c92ee6	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:25:55.792698	\N	\N	2026-01-12 03:25:55.792698	2026-01-12 03:25:55.792698
04c5571a-1569-43b9-8936-d73946590b09	3c8f2e28-60d2-408a-8445-75484d60844f	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:41.876014	\N	\N	2026-01-12 03:16:41.876014	2026-01-12 03:25:56.251184
f13fdd70-2a6e-4fd9-be63-6d171a74e133	6991571b-3fc4-4ec0-9744-c7949583b046	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.076247	\N	\N	2026-01-12 03:16:42.076247	2026-01-12 03:25:56.501508
544d6b39-caea-4bb5-83e5-78ac544743b5	413d893a-79fb-4eed-a606-29bb227361a6	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:42.574276	\N	\N	2026-01-12 03:16:42.574276	2026-01-12 03:25:57.151037
a3bfc738-42a1-410b-b6de-19fc7fc15967	2fff4e81-4f43-4e60-9ba7-45d013e445f0	2025-11-02	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 03:16:43.134904	\N	\N	2026-01-12 03:16:43.134904	2026-01-12 03:25:57.818055
ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	4ede20dd-c902-47bd-892d-7661d0b66f17	2025-11-02	3188.00	Aprobado	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	38057ae0-41a9-48ef-926f-497727e37f07	2026-01-12 03:16:40.900797	2026-01-12 03:28:36.733922	\N	2026-01-12 03:16:40.900797	2026-01-12 03:28:36.733922
ad69d72a-16f1-467f-a207-8baf9e5011e8	bc7074e5-4b10-4968-9f4b-2fa9c02a0e0a	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.212418	\N	\N	2026-01-12 04:10:51.212418	2026-01-12 04:10:51.212418
acde514a-2026-456d-83e4-eadefaac15fe	e86fda90-38c9-450a-bc1c-f398eb2f087a	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.260262	\N	\N	2026-01-12 04:10:51.260262	2026-01-12 04:10:51.260262
7911d981-ff9c-41b9-b204-4d4c42899a48	c390d434-9260-4e69-9bc1-05c10b8daa38	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.301835	\N	\N	2026-01-12 04:10:51.301835	2026-01-12 04:10:51.301835
12e0746f-99c9-4389-a670-86fc8a015e10	ddcd60ff-75b1-4ed9-9700-cdb9e36bcd64	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.385551	\N	\N	2026-01-12 04:10:51.385551	2026-01-12 04:10:51.385551
7ed99cc7-6a72-4773-9acf-1a52b303bedf	f92dfa28-b2e1-46f0-a978-b81ee9fec785	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.424992	\N	\N	2026-01-12 04:10:51.424992	2026-01-12 04:10:51.424992
0a537c23-299f-4193-bb11-e7ca8104895f	11a55b89-2ce7-4248-87f8-8c59a8f18330	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.458192	\N	\N	2026-01-12 04:10:51.458192	2026-01-12 04:10:51.458192
75e49a26-bf3f-4d91-80ff-4d9931d453ce	64e68d24-2370-477f-97b7-59f1617013ff	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.496548	\N	\N	2026-01-12 04:10:51.496548	2026-01-12 04:10:51.496548
10833a40-10dd-4bcf-82bf-7e20bd05fe15	dccaab02-3e55-4c5b-94a3-0c34b6202f62	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.536667	\N	\N	2026-01-12 04:10:51.536667	2026-01-12 04:10:51.536667
09ee7f4c-3b69-4281-93f7-4e01475255c0	7c26f913-b308-48d0-9a92-514aba4c4ce2	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.578285	\N	\N	2026-01-12 04:10:51.578285	2026-01-12 04:10:51.578285
2db4d26e-08d3-4e1b-8837-e2bec5e51948	738238d9-25cd-4f00-a191-abfde4e9bed6	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.620084	\N	\N	2026-01-12 04:10:51.620084	2026-01-12 04:10:51.620084
3bab1322-6522-461f-8c8c-efb79f6f834d	041b42ac-770c-4042-a26f-9f3f7952d990	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.66167	\N	\N	2026-01-12 04:10:51.66167	2026-01-12 04:10:51.66167
80096553-8199-4f4b-bbf8-1fa2ef6cd7ca	8f83082c-b547-4ae0-bdec-323ba98933f8	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.703454	\N	\N	2026-01-12 04:10:51.703454	2026-01-12 04:10:51.703454
202425f6-a253-4c54-a45e-d602e087ccaf	d00edd18-e375-4553-bbf3-e4a524d4b0ac	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.745064	\N	\N	2026-01-12 04:10:51.745064	2026-01-12 04:10:51.745064
f4973e83-6908-4fb7-a106-ca022f00b14c	28ad3580-8061-4a6d-8db3-bbe367f54058	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.786709	\N	\N	2026-01-12 04:10:51.786709	2026-01-12 04:10:51.786709
0c21bc50-0401-4862-9165-901efb96ce21	5e1cef33-0274-4863-b6ef-348bc2a9216e	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.828681	\N	\N	2026-01-12 04:10:51.828681	2026-01-12 04:10:51.828681
34527ab2-8507-4f96-beab-257ffab4641e	14f77980-3e47-4f46-a0ce-36721666bee4	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.870336	\N	\N	2026-01-12 04:10:51.870336	2026-01-12 04:10:51.870336
cd36098c-63c0-4323-950e-1cf6eb98d72c	70c9e2b3-65a3-4e41-a437-2c5a0b05e15d	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.911565	\N	\N	2026-01-12 04:10:51.911565	2026-01-12 04:10:51.911565
07b93af4-efbf-4002-b368-6590a50316af	9e944584-a75c-474a-8faa-6d8a9a39b734	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.945677	\N	\N	2026-01-12 04:10:51.945677	2026-01-12 04:10:51.945677
2634384f-ac35-4fc2-b637-9afc1638b61f	4784eb45-e611-48d2-9cfd-af51e885d671	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:51.988349	\N	\N	2026-01-12 04:10:51.988349	2026-01-12 04:10:51.988349
b00775bc-02aa-415d-8037-7bf025adcb65	198d0d56-2e88-4ecc-9403-de4fda41624c	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.028436	\N	\N	2026-01-12 04:10:52.028436	2026-01-12 04:10:52.028436
bc723d31-4a9a-4071-906a-851d1376dd14	7b014b00-fbd9-4c83-bde3-0ee332d40cc6	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.069874	\N	\N	2026-01-12 04:10:52.069874	2026-01-12 04:10:52.069874
4df0b612-0143-4099-9170-fa42287cd4c1	042f9c57-30ce-4847-96d1-c00c57c92ee6	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.113366	\N	\N	2026-01-12 04:10:52.113366	2026-01-12 04:10:52.113366
b79c164b-41d5-412f-8790-a06e9b473646	3d0aa232-8b6a-4155-9b94-b47fd219292a	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.155092	\N	\N	2026-01-12 04:10:52.155092	2026-01-12 04:10:52.155092
af967188-3107-4ac6-92a4-43b91749919d	45f22cd5-016a-4d04-8dc2-c62eb1df9a3c	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.196803	\N	\N	2026-01-12 04:10:52.196803	2026-01-12 04:10:52.196803
cf856f2c-21aa-404c-bd08-3bbf472f2edb	54c0cde6-fc6c-4b68-be01-824eff420b27	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.238535	\N	\N	2026-01-12 04:10:52.238535	2026-01-12 04:10:52.238535
ed847c1b-537e-469a-bc7a-d0a3e102a2f8	8443fc94-4834-49bc-a4fd-a830ae2305d9	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.279861	\N	\N	2026-01-12 04:10:52.279861	2026-01-12 04:10:52.279861
33a262a4-77be-4bbc-b53f-779e7779d4dd	560e8137-619c-4d86-8ada-d8f53764be3d	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.312842	\N	\N	2026-01-12 04:10:52.312842	2026-01-12 04:10:52.312842
eeb7af79-c8d2-40f9-80ae-ed8e173c9e73	b3c2dc63-ce92-4218-91f1-0b9ce3a50d6a	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.346889	\N	\N	2026-01-12 04:10:52.346889	2026-01-12 04:10:52.346889
a8bddc97-48b7-40f2-aaa1-78ff04e361bc	3be3f6fe-ea62-4375-9a5a-2b35b33e7a71	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.388672	\N	\N	2026-01-12 04:10:52.388672	2026-01-12 04:10:52.388672
8824434b-110a-40b8-afc8-8bd07e80e546	b60f4736-5754-458f-b980-a635ce77b6b0	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.430248	\N	\N	2026-01-12 04:10:52.430248	2026-01-12 04:10:52.430248
59b65c2c-773a-468c-9242-85f0f58edc7d	efef6cc9-f70b-4764-8ec4-db630476f0c6	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.472061	\N	\N	2026-01-12 04:10:52.472061	2026-01-12 04:10:52.472061
3cad4145-712b-4bee-ba78-4eeffd65bbea	a9e5196d-ce0b-401f-b4ec-fab3b0e169a7	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.513395	\N	\N	2026-01-12 04:10:52.513395	2026-01-12 04:10:52.513395
e176f6c5-a5ef-4f2c-8072-221d0bacacc9	3c8f2e28-60d2-408a-8445-75484d60844f	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.547845	\N	\N	2026-01-12 04:10:52.547845	2026-01-12 04:10:52.547845
e7ecda81-faab-4750-b244-0eff4690939d	9792eed5-77a4-48e6-9ccb-6026fa8f28f3	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.588406	\N	\N	2026-01-12 04:10:52.588406	2026-01-12 04:10:52.588406
914e5c7f-9b0a-43f9-bfcd-b1371120b165	4a211954-7527-4f93-a92d-e133feb11d87	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.621556	\N	\N	2026-01-12 04:10:52.621556	2026-01-12 04:10:52.621556
5d0731be-2474-4773-a0e0-d9877c95f204	8122ef0e-2b39-473c-8467-0efdcabb66b0	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.663541	\N	\N	2026-01-12 04:10:52.663541	2026-01-12 04:10:52.663541
7581d5ca-0b94-499f-83e4-5edc739007e9	31ee5f60-ce34-418d-852b-89ed873dc1f5	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.696874	\N	\N	2026-01-12 04:10:52.696874	2026-01-12 04:10:52.696874
31e2f3f0-e7e3-42c5-8b4e-8f0bd7ca7610	38def561-e6c2-409f-85eb-a4314b3cda17	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.739154	\N	\N	2026-01-12 04:10:52.739154	2026-01-12 04:10:52.739154
0ce86915-79ea-488e-ae1d-5c0d2494a9ea	6991571b-3fc4-4ec0-9744-c7949583b046	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.779844	\N	\N	2026-01-12 04:10:52.779844	2026-01-12 04:10:52.779844
a2c11128-f884-4dc2-a25c-e98659af59b7	0d4ab4b0-e579-4ce3-b512-8efe56b59ef7	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.813557	\N	\N	2026-01-12 04:10:52.813557	2026-01-12 04:10:52.813557
a98b60ce-4ad8-406c-9de9-294087b4f853	dfb60f00-5227-4349-9517-1168b5a200ae	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.846899	\N	\N	2026-01-12 04:10:52.846899	2026-01-12 04:10:52.846899
16cf3ac8-27a7-469a-bccc-171193565776	cd01e992-d9ee-40f7-aa13-4a5030ea6de8	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.880046	\N	\N	2026-01-12 04:10:52.880046	2026-01-12 04:10:52.880046
ab048870-3174-4755-a1ac-693d6f6a6c95	7f555243-cf16-44ec-bfec-14ec1702709e	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.911869	\N	\N	2026-01-12 04:10:52.911869	2026-01-12 04:10:52.911869
da66b826-e89e-47ef-998a-fb8e7ce8dcdf	90a866be-f398-474d-a219-24d5f271c97e	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.946546	\N	\N	2026-01-12 04:10:52.946546	2026-01-12 04:10:52.946546
9a831a1e-fb63-462c-9d66-0aeeeb9206f3	f5126840-9259-4026-acfb-d1b7219136cc	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:52.980217	\N	\N	2026-01-12 04:10:52.980217	2026-01-12 04:10:52.980217
4ee5fab7-e692-4b4f-ba9a-7bf1162a1e1b	fbc0adeb-5fb5-46fc-be71-3323a9e66c2c	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.013646	\N	\N	2026-01-12 04:10:53.013646	2026-01-12 04:10:53.013646
628ec9f0-1089-4ae7-994c-7e14b044a9a4	398fa6be-7991-4fa8-bd11-99db2ed0b52a	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.046856	\N	\N	2026-01-12 04:10:53.046856	2026-01-12 04:10:53.046856
469f9cb8-22d5-487b-b865-fc9a8e3d4b63	f704818a-fc0b-449a-b701-bdf8f496e44e	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.080197	\N	\N	2026-01-12 04:10:53.080197	2026-01-12 04:10:53.080197
b5be03dd-d9d7-499f-bd06-3dbfd2818e66	9768be35-7a8e-4f19-97af-d315ddedbfcf	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.113551	\N	\N	2026-01-12 04:10:53.113551	2026-01-12 04:10:53.113551
a839468c-9a60-4d42-8701-68624a57628d	00a528bc-1114-4b20-b481-abe74da0c1ff	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.146876	\N	\N	2026-01-12 04:10:53.146876	2026-01-12 04:10:53.146876
2847ae4b-bab8-43a4-9710-8975d835ff00	103a95df-93a4-49e0-8e23-2c4c1cb6ee39	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.18021	\N	\N	2026-01-12 04:10:53.18021	2026-01-12 04:10:53.18021
025c241b-edf6-4d8f-94b4-0563cef86cde	a158eacc-3524-4ad3-8521-bd2a5207b140	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.213636	\N	\N	2026-01-12 04:10:53.213636	2026-01-12 04:10:53.213636
53f05cf4-73bb-47a1-ba1a-48fea533a436	0b11fdd0-2381-41c8-ad1d-6a98a6b18133	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.247109	\N	\N	2026-01-12 04:10:53.247109	2026-01-12 04:10:53.247109
433546b6-d201-4791-a346-aa0ddd99fdaa	413d893a-79fb-4eed-a606-29bb227361a6	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.288767	\N	\N	2026-01-12 04:10:53.288767	2026-01-12 04:10:53.288767
16a0b428-62d3-4587-a946-9a57abc9dbe4	efe73bef-f6ed-436c-9f53-ee6f2561b276	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.330123	\N	\N	2026-01-12 04:10:53.330123	2026-01-12 04:10:53.330123
99b346a5-4720-4129-96dc-b84c442eb2b0	c1da10fc-bb68-4233-8f8f-c26b93d2fcd0	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.363804	\N	\N	2026-01-12 04:10:53.363804	2026-01-12 04:10:53.363804
244f47a1-e8aa-445a-a079-5336efcdcac9	5fbce81f-4611-43ac-afee-2734d0c52c6c	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.404976	\N	\N	2026-01-12 04:10:53.404976	2026-01-12 04:10:53.404976
d15fe173-4b91-41d4-a357-addb45ef0355	38ee891a-3ba2-40ef-a01e-a800aa64acfe	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.438582	\N	\N	2026-01-12 04:10:53.438582	2026-01-12 04:10:53.438582
0ebf03cc-8db2-4bf3-9d37-36014cf10c6d	3351e1a4-1ef2-43ae-b936-689fff1661fe	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.471515	\N	\N	2026-01-12 04:10:53.471515	2026-01-12 04:10:53.471515
1246b9a7-2f5d-4915-af21-03bbd8370bed	70869a90-c6bb-4a71-8409-81553dbd16b6	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.504754	\N	\N	2026-01-12 04:10:53.504754	2026-01-12 04:10:53.504754
a415251f-c88c-4d53-95ea-51674330e06d	1038e9aa-c5f0-4483-8b10-58cb79fda86b	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.539294	\N	\N	2026-01-12 04:10:53.539294	2026-01-12 04:10:53.539294
8a7ee8b4-cef3-4380-ba15-ee8f99bec9dd	5343f6a2-49db-4408-bce5-68b2278ac202	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.578764	\N	\N	2026-01-12 04:10:53.578764	2026-01-12 04:10:53.578764
ee22d8c9-9a17-4f0e-922c-d65235dd949b	9c3176e2-e778-4b79-848a-2b5f9c9550ed	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.610798	\N	\N	2026-01-12 04:10:53.610798	2026-01-12 04:10:53.610798
3e0b173f-2f11-4c4c-832d-f7c93bbc281f	91378420-512b-4c0e-a21c-965a9249efc9	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.647247	\N	\N	2026-01-12 04:10:53.647247	2026-01-12 04:10:53.647247
9dfa9326-f2e1-42af-a89c-ae104aa5a630	b46042b2-a78f-4e14-905c-25929890ee49	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.688735	\N	\N	2026-01-12 04:10:53.688735	2026-01-12 04:10:53.688735
9602eb8b-f1d4-47a9-ab00-087add37fc0d	6a4cccf9-1b62-419f-8cb9-7c32a288780c	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.722136	\N	\N	2026-01-12 04:10:53.722136	2026-01-12 04:10:53.722136
bff06bcb-22ec-4cc2-8878-f56eb559b536	5e04d805-17da-48be-a850-f5249ec89a82	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.763892	\N	\N	2026-01-12 04:10:53.763892	2026-01-12 04:10:53.763892
c07974c3-69e9-481a-bafd-9c0aec9d763b	6d6610af-b1f6-4408-96fe-ae7b42017f44	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.797131	\N	\N	2026-01-12 04:10:53.797131	2026-01-12 04:10:53.797131
20f6a7b1-768c-4e47-b443-c518f56df240	7a347e96-3ac5-4de3-afd2-62145554d35f	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.830111	\N	\N	2026-01-12 04:10:53.830111	2026-01-12 04:10:53.830111
2f99162e-a3ac-4e00-949d-d32ed87a3910	2fff4e81-4f43-4e60-9ba7-45d013e445f0	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.863854	\N	\N	2026-01-12 04:10:53.863854	2026-01-12 04:10:53.863854
b869c88f-3b36-4ca0-817f-7722d4b67d41	7b4124c9-7b4e-4e1a-8842-38b123114b57	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.896853	\N	\N	2026-01-12 04:10:53.896853	2026-01-12 04:10:53.896853
ab36e577-ef93-47c4-a6f2-f7f31aa07836	eb218f9f-4910-47ff-af1a-9fbc0e102050	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.930641	\N	\N	2026-01-12 04:10:53.930641	2026-01-12 04:10:53.930641
11f7101d-771e-4b00-b5dc-279e5453f97e	93bf467b-5397-4528-b232-133972b43567	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.963478	\N	\N	2026-01-12 04:10:53.963478	2026-01-12 04:10:53.963478
6bf4a0fb-71c8-4da4-84f9-56a3c3db359e	1afbd69f-e12b-438b-b5ed-0deb2646f148	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:53.997151	\N	\N	2026-01-12 04:10:53.997151	2026-01-12 04:10:53.997151
0cd8ee78-284c-4e85-b1f1-ddbd276fc033	711b056b-b683-4433-93f0-2f99ec7b68a6	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:54.030414	\N	\N	2026-01-12 04:10:54.030414	2026-01-12 04:10:54.030414
9e0dc4b3-3f05-4551-9aa0-fb20a376238e	a4ec3802-bbac-49d5-b1d1-2ca21f8a3bd5	2025-11-03	0.00	Pendiente	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	\N	2026-01-12 04:10:54.06384	\N	\N	2026-01-12 04:10:54.06384	2026-01-12 04:10:54.06384
a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	4ede20dd-c902-47bd-892d-7661d0b66f17	2025-11-03	8295.00	Aprobado	9bc3719f-5507-45fa-a6b8-03e1745ad0e9	38057ae0-41a9-48ef-926f-497727e37f07	2026-01-12 04:10:51.343628	2026-01-12 05:02:54.478008	\N	2026-01-12 04:10:51.343628	2026-01-12 05:02:54.478008
\.


--
-- Data for Name: reportes_auditoria; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.reportes_auditoria (id, reporte_id, usuario_id, usuario_nombre, accion, campo_modificado, valor_anterior, valor_nuevo, descripcion, fecha_cambio) FROM stdin;
bf9ab415-93da-41c1-a61b-a4f1dba540ef	7643468d-c7d3-4828-9f73-a66bd581597b	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Múltiples campos	\N	\N	Reporte actualizado por gerente.estacion@repvtas.com. Cambios: Fecha: Sat Nov 01 2025 00:00:00 GMT-0600 (hora estándar central) → 2025-11-01; Aceites: $0.00 → $5186.01; Premium Iib: 0.00 → 14946.00; Premium Iffb: 0.00 → 11582.00; Magna Iib: 0.00 → 53860.00; Magna Iffb: 0.00 → 42683.00; Diesel Iib: 0.00 → 42607.00; Diesel Iffb: 0.00 → 40507.00	2026-01-11 20:32:54.412467
8d15916d-0f07-4431-b586-8c4720945eb4	7643468d-c7d3-4828-9f73-a66bd581597b	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	CAMBIO_ESTADO	estado	Pendiente	EnRevision	Estado cambiado de Pendiente a EnRevision	2026-01-11 20:32:59.168764
c455896b-0870-4004-96ae-09ffde19ba99	7643468d-c7d3-4828-9f73-a66bd581597b	38057ae0-41a9-48ef-926f-497727e37f07	gerente.zona@repvtas.com	APROBAR	estado	EnRevision	Aprobado	Estado cambiado de EnRevision a Aprobado	2026-01-11 20:34:15.757383
60799b9d-f07a-41ec-b0f8-e28181a60cee	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Fecha	Sun Nov 02 2025 00:00:00 GMT-0600 (hora estándar central)	2025-11-02	Campo "Fecha" actualizado	2026-01-12 03:27:00.354383
d47538ad-1a09-4f06-b51f-988b868de628	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Fecha	Sun Nov 02 2025 00:00:00 GMT-0600 (hora estándar central)	2025-11-02	Campo "Fecha" actualizado	2026-01-12 03:28:12.594106
0c36c2b7-7b58-4eb9-9384-fefd08f3a22d	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Aceites	$0.00	$3188.00	Campo "Aceites" actualizado	2026-01-12 03:28:12.602205
7f29571b-24c5-4fdb-9c66-343db63048c1	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Premium Iffb	0.00	8588.00	Campo "Premium Iffb" actualizado	2026-01-12 03:28:12.610385
b359b13e-c3e3-4264-afbd-b4fb7d755739	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Magna Iffb	0.00	33016.00	Campo "Magna Iffb" actualizado	2026-01-12 03:28:12.618883
0fe37ce4-02a9-4d8f-82d5-1eeaf602ba7b	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Diesel Iffb	0.00	39882.00	Campo "Diesel Iffb" actualizado	2026-01-12 03:28:12.627193
157966fe-9ca9-463b-a6c2-e0b6b43ad4f8	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	CAMBIO_ESTADO	estado	Pendiente	EnRevision	Estado cambiado de Pendiente a EnRevision	2026-01-12 03:28:19.218279
a40eb7ba-1624-41b3-98c8-6aceb92456d0	ebbcd00e-be4f-4b6f-84f4-8625a3ff370f	38057ae0-41a9-48ef-926f-497727e37f07	gerente.zona@repvtas.com	APROBAR	estado	EnRevision	Aprobado	Estado cambiado de EnRevision a Aprobado	2026-01-12 03:28:36.750907
8cb1081f-8e38-48ba-9d15-6102715750b3	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Fecha	Mon Nov 03 2025 00:00:00 GMT-0600 (hora estándar central)	2025-11-03	Campo "Fecha" actualizado	2026-01-12 04:12:31.692118
49bb0e56-e0e6-4198-85b9-d4870433812c	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Aceites	$0.00	$8295.00	Campo "Aceites" actualizado	2026-01-12 04:12:31.699163
b4f5f593-be07-409c-8feb-d7765d9d2f65	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Premium Iffb	0.00	4912.00	Campo "Premium Iffb" actualizado	2026-01-12 04:12:31.707659
71711ce7-ca26-4561-a333-79f37aa1b414	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Magna Iffb	0.00	21593.00	Campo "Magna Iffb" actualizado	2026-01-12 04:12:31.71592
3c77f7df-aa8d-490e-834d-6cb7540458eb	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	ACTUALIZAR	Diesel Iffb	0.00	37142.00	Campo "Diesel Iffb" actualizado	2026-01-12 04:12:31.724298
ca9e763e-6f93-489d-9331-d396931994cb	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	CAMBIO_ESTADO	estado	Pendiente	EnRevision	Estado cambiado de Pendiente a EnRevision	2026-01-12 05:02:39.670465
b42466ff-327d-4bb6-86e1-810947226c94	a9d72f30-71f9-4f9e-8fc8-4a3e718dca66	38057ae0-41a9-48ef-926f-497727e37f07	gerente.zona@repvtas.com	APROBAR	estado	EnRevision	Aprobado	Estado cambiado de EnRevision a Aprobado	2026-01-12 05:02:54.493877
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.roles (id, codigo, nombre, descripcion, activo, orden, created_at, updated_at) FROM stdin;
f34c3713-fa81-4cd7-8c52-972e354de982	Administrador	Administrador	Acceso completo al sistema	t	1	2026-01-10 03:43:09.015069	2026-01-10 03:43:09.015069
db466306-ca25-438c-890e-e4b67fd8422b	GerenteEstacion	Gerente de Estación	Gestiona reportes de estaciones asignadas	t	2	2026-01-10 03:43:09.015069	2026-01-10 03:43:09.015069
4ee6811f-1401-4397-b5e9-d4ed49ddb442	GerenteZona	Gerente de Zona	Revisa y aprueba reportes de su zona	t	3	2026-01-10 03:43:09.015069	2026-01-10 03:43:09.015069
0a41062b-062d-4157-a732-c591e1a975ca	Direccion	Dirección	Visualiza reportes aprobados	t	4	2026-01-10 03:43:09.015069	2026-01-10 03:43:09.015069
\.


--
-- Data for Name: user_estaciones; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.user_estaciones (user_id, estacion_id) FROM stdin;
6d79daf8-34fa-464b-a06c-11ab02e1bf36	4ede20dd-c902-47bd-892d-7661d0b66f17
6d79daf8-34fa-464b-a06c-11ab02e1bf36	91378420-512b-4c0e-a21c-965a9249efc9
6d79daf8-34fa-464b-a06c-11ab02e1bf36	1afbd69f-e12b-438b-b5ed-0deb2646f148
6d79daf8-34fa-464b-a06c-11ab02e1bf36	eb218f9f-4910-47ff-af1a-9fbc0e102050
6d79daf8-34fa-464b-a06c-11ab02e1bf36	7c26f913-b308-48d0-9a92-514aba4c4ce2
\.


--
-- Data for Name: user_zonas; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.user_zonas (user_id, zona_id) FROM stdin;
38057ae0-41a9-48ef-926f-497727e37f07	d306ffa3-42aa-40b3-962a-6169036ffb74
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.users (id, email, password_hash, name, role, oauth_provider, oauth_id, created_at, updated_at, role_id, two_factor_secret, two_factor_enabled) FROM stdin;
6d79daf8-34fa-464b-a06c-11ab02e1bf36	gerente.estacion@repvtas.com	$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC	Gerente Estación	GerenteEstacion	\N	\N	2026-01-10 05:19:25.413982	2026-01-10 05:19:25.413982	db466306-ca25-438c-890e-e4b67fd8422b	\N	f
38057ae0-41a9-48ef-926f-497727e37f07	gerente.zona@repvtas.com	$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC	Gerente Zona	GerenteZona	\N	\N	2026-01-10 05:19:25.422414	2026-01-10 05:19:25.422414	4ee6811f-1401-4397-b5e9-d4ed49ddb442	\N	f
7752f287-42c9-4455-b961-94cef4b023ff	director@repvtas.com	$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC	Director	Direccion	\N	\N	2026-01-10 05:19:25.430727	2026-01-10 05:19:25.430727	0a41062b-062d-4157-a732-c591e1a975ca	\N	f
9bc3719f-5507-45fa-a6b8-03e1745ad0e9	admin@repvtas.com	$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC	Administrador	Administrador	\N	\N	2026-01-10 05:19:25.38174	2026-01-10 05:19:25.38174	f34c3713-fa81-4cd7-8c52-972e354de982	CNUCINK3EM4XSKJY	t
\.


--
-- Data for Name: zonas; Type: TABLE DATA; Schema: public; Owner: webops
--

COPY public.zonas (id, nombre, activa, created_at) FROM stdin;
e00ab647-46d7-4d47-b7af-d1f3d1a82ada	Zona Occidente	t	2026-01-11 16:10:23.956992
d306ffa3-42aa-40b3-962a-6169036ffb74	Zona Sur	t	2026-01-11 16:10:35.74189
5b789453-5ae2-4efa-a43c-6b6d3e0f1ec8	Zona Bajio	t	2026-01-11 16:10:43.790786
\.


--
-- Name: configuracion configuracion_clave_key; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_clave_key UNIQUE (clave);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (id);


--
-- Name: estaciones estaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.estaciones
    ADD CONSTRAINT estaciones_pkey PRIMARY KEY (id);


--
-- Name: menu_roles menu_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.menu_roles
    ADD CONSTRAINT menu_roles_pkey PRIMARY KEY (menu_id, role_id);


--
-- Name: menus menus_menu_id_key; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_menu_id_key UNIQUE (menu_id);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: productos_catalogo productos_catalogo_nombre_api_key; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.productos_catalogo
    ADD CONSTRAINT productos_catalogo_nombre_api_key UNIQUE (nombre_api);


--
-- Name: productos_catalogo productos_catalogo_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.productos_catalogo
    ADD CONSTRAINT productos_catalogo_pkey PRIMARY KEY (id);


--
-- Name: reporte_productos reporte_productos_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reporte_productos
    ADD CONSTRAINT reporte_productos_pkey PRIMARY KEY (id);


--
-- Name: reporte_productos reporte_productos_reporte_id_producto_id_key; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reporte_productos
    ADD CONSTRAINT reporte_productos_reporte_id_producto_id_key UNIQUE (reporte_id, producto_id);


--
-- Name: reportes_auditoria reportes_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reportes_auditoria
    ADD CONSTRAINT reportes_auditoria_pkey PRIMARY KEY (id);


--
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- Name: roles roles_codigo_key; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_codigo_key UNIQUE (codigo);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_estaciones user_estaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.user_estaciones
    ADD CONSTRAINT user_estaciones_pkey PRIMARY KEY (user_id, estacion_id);


--
-- Name: user_zonas user_zonas_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.user_zonas
    ADD CONSTRAINT user_zonas_pkey PRIMARY KEY (user_id, zona_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: zonas zonas_pkey; Type: CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_pkey PRIMARY KEY (id);


--
-- Name: idx_configuracion_clave; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_configuracion_clave ON public.configuracion USING btree (clave);


--
-- Name: idx_estaciones_identificador_externo; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_estaciones_identificador_externo ON public.estaciones USING btree (identificador_externo);


--
-- Name: idx_menu_roles_menu_id; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_menu_roles_menu_id ON public.menu_roles USING btree (menu_id);


--
-- Name: idx_menu_roles_role_id; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_menu_roles_role_id ON public.menu_roles USING btree (role_id);


--
-- Name: idx_menus_menu_id; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_menus_menu_id ON public.menus USING btree (menu_id);


--
-- Name: idx_reporte_productos_producto_id; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reporte_productos_producto_id ON public.reporte_productos USING btree (producto_id);


--
-- Name: idx_reporte_productos_reporte_id; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reporte_productos_reporte_id ON public.reporte_productos USING btree (reporte_id);


--
-- Name: idx_reportes_auditoria_fecha; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reportes_auditoria_fecha ON public.reportes_auditoria USING btree (fecha_cambio DESC);


--
-- Name: idx_reportes_auditoria_reporte_id; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reportes_auditoria_reporte_id ON public.reportes_auditoria USING btree (reporte_id);


--
-- Name: idx_reportes_creado_por; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reportes_creado_por ON public.reportes USING btree (creado_por);


--
-- Name: idx_reportes_estacion; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reportes_estacion ON public.reportes USING btree (estacion_id);


--
-- Name: idx_reportes_estado; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reportes_estado ON public.reportes USING btree (estado);


--
-- Name: idx_reportes_fecha; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_reportes_fecha ON public.reportes USING btree (fecha);


--
-- Name: idx_roles_codigo; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_roles_codigo ON public.roles USING btree (codigo);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: webops
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: estaciones estaciones_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.estaciones
    ADD CONSTRAINT estaciones_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id);


--
-- Name: menu_roles menu_roles_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.menu_roles
    ADD CONSTRAINT menu_roles_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;


--
-- Name: menu_roles menu_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.menu_roles
    ADD CONSTRAINT menu_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: reporte_productos reporte_productos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reporte_productos
    ADD CONSTRAINT reporte_productos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos_catalogo(id);


--
-- Name: reporte_productos reporte_productos_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reporte_productos
    ADD CONSTRAINT reporte_productos_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reportes(id) ON DELETE CASCADE;


--
-- Name: reportes_auditoria reportes_auditoria_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reportes_auditoria
    ADD CONSTRAINT reportes_auditoria_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reportes(id) ON DELETE CASCADE;


--
-- Name: reportes_auditoria reportes_auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reportes_auditoria
    ADD CONSTRAINT reportes_auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id);


--
-- Name: reportes reportes_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.users(id);


--
-- Name: reportes reportes_estacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_estacion_id_fkey FOREIGN KEY (estacion_id) REFERENCES public.estaciones(id);


--
-- Name: reportes reportes_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.users(id);


--
-- Name: user_estaciones user_estaciones_estacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.user_estaciones
    ADD CONSTRAINT user_estaciones_estacion_id_fkey FOREIGN KEY (estacion_id) REFERENCES public.estaciones(id) ON DELETE CASCADE;


--
-- Name: user_estaciones user_estaciones_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.user_estaciones
    ADD CONSTRAINT user_estaciones_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_zonas user_zonas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.user_zonas
    ADD CONSTRAINT user_zonas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_zonas user_zonas_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.user_zonas
    ADD CONSTRAINT user_zonas_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: webops
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict amGn38dUzHZoeUTIiBSF0kJNLHLAfCM7eGgLvPBoRvlQo1KOdzwZsYq2oNY1UU8

