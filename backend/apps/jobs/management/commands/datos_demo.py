"""
Carga datos de demostracion (los mismos del mockup) para probar el MVP
o para la presentacion:

    python manage.py datos_demo

Crea empresas, vacantes, estudiantes y postulaciones. Se puede correr
varias veces: lo que ya existe no se duplica. Todas las cuentas usan la
contrasena que imprime al final.

NO lo corras en produccion si ya hay usuarios reales: las cuentas demo
quedarian visibles para todos.
"""
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Role, User
from apps.accounts.serializers import crear_perfil
from apps.applications.models import Application
from apps.jobs.models import Vacancy, VacancyStatus
from apps.moderation.models import ReviewStatus

PASSWORD = "PractiYA2026!"

EMPRESAS = [
    {"email": "demo.technova@practiya.co", "legal_name": "TechNova S.A.S.", "nit": "901.234.567-8",
     "city": "Bogotá", "website": "www.technova.com.co", "sectors": ["Tecnología", "Datos", "Fintech"],
     "about": "Empresa de soluciones de datos y analítica para el sector financiero, con más de 10 años "
              "formando practicantes en etapa productiva.",
     "status": ReviewStatus.APROBADA},
    {"email": "demo.disenostudio@practiya.co", "legal_name": "Diseño Interior Studio", "nit": "900.876.543-1",
     "city": "Medellín", "website": "www.disenointerior.co", "sectors": ["Diseño", "Retail"],
     "about": "Estudio de diseño de producto y experiencia de usuario para marcas del sector retail.",
     "status": ReviewStatus.APROBADA},
    {"email": "demo.agrotech@practiya.co", "legal_name": "Agrotech Colombia", "nit": "901.555.210-4",
     "city": "Bogotá", "website": "www.agrotech.com.co", "sectors": ["Agroindustria"],
     "about": "Procesamiento agroindustrial con trazabilidad de punta a punta.",
     "status": ReviewStatus.APROBADA},
    {"email": "demo.andina@practiya.co", "legal_name": "Grupo Andina Logística", "nit": "890.112.334-2",
     "city": "Cali", "website": "www.andinalogistica.co", "sectors": ["Logística"],
     "about": "Operador logístico con centros de distribución en el suroccidente del país.",
     "status": ReviewStatus.PENDIENTE},
    {"email": "demo.bancosur@practiya.co", "legal_name": "Banco Sur", "nit": "800.556.221-9",
     "city": "Medellín", "website": "www.bancosur.co", "sectors": ["Banca"],
     "about": "Entidad financiera regional.",
     "status": ReviewStatus.PENDIENTE},
]

VACANTES = [
    ("demo.technova@practiya.co", {
        "title": "Practicante de Análisis de Datos", "city": "Bogotá", "modality": "HIBRIDA",
        "stage": "PRODUCTIVA", "openings": 2, "stipend": "100% de un SMLV",
        "description": "Como practicante de análisis de datos, apoyarás al equipo de Business Intelligence en "
                       "la limpieza, modelado y visualización de datos para las áreas comerciales de la "
                       "compañía. Trabajarás junto a un analista senior que guiará tu aprendizaje durante "
                       "los 6 meses de la etapa productiva.",
        "requirements": ["Estudiante de Ingeniería, Estadística o carreras afines",
                         "Conocimientos básicos de SQL y Excel avanzado",
                         "Disponibilidad para contrato de aprendizaje de tiempo completo",
                         "Cursando etapa productiva"],
        "skills": ["SQL", "Excel", "Power BI", "Python"], "status": VacancyStatus.APROBADA}),
    ("demo.technova@practiya.co", {
        "title": "Practicante de Backend Jr.", "city": "Bogotá", "modality": "REMOTA",
        "stage": "PRODUCTIVA", "openings": 1, "stipend": "100% de un SMLV",
        "description": "Apoyarás al equipo de ingeniería en el desarrollo y las pruebas de servicios web "
                       "para los productos de analítica de la compañía.",
        "requirements": ["Estudiante de Ingeniería de Sistemas o afines", "Bases de Python o Java"],
        "skills": ["Python", "Django", "Git"], "status": VacancyStatus.APROBADA}),
    ("demo.technova@practiya.co", {
        "title": "Practicante de Soporte TI", "city": "Bogotá", "modality": "PRESENCIAL",
        "stage": "LECTIVA", "openings": 1, "stipend": "75% de un SMLV",
        "description": "Soporte de primer nivel a usuarios internos y gestión del inventario de equipos.",
        "requirements": ["Técnico o tecnólogo en Sistemas"], "skills": ["Soporte", "Redes"],
        "status": VacancyStatus.PAUSADA}),
    ("demo.technova@practiya.co", {
        "title": "Practicante Contable", "city": "Bogotá", "modality": "PRESENCIAL",
        "stage": "PRODUCTIVA", "description": "", "status": VacancyStatus.BORRADOR}),
    ("demo.disenostudio@practiya.co", {
        "title": "Practicante de Diseño UX/UI", "city": "Medellín", "modality": "PRESENCIAL",
        "stage": "PRODUCTIVA", "openings": 1, "stipend": "100% de un SMLV",
        "description": "Acompañarás al equipo de producto en la investigación de usuarios, wireframing y "
                       "prototipado de interfaces para clientes del sector retail. Ideal para quien quiere "
                       "ver un proyecto de diseño de punta a punta.",
        "requirements": ["Estudiante de Diseño Gráfico, Industrial o afines", "Manejo de Figma",
                         "Portafolio con al menos 2 proyectos", "Etapa productiva o lectiva avanzada"],
        "skills": ["Figma", "Prototipado", "Investigación UX"], "status": VacancyStatus.APROBADA}),
    ("demo.agrotech@practiya.co", {
        "title": "Practicante Agroindustrial", "city": "Bogotá", "modality": "PRESENCIAL",
        "stage": "LECTIVA", "openings": 2, "stipend": "50% de un SMLV",
        "description": "Apoyarás al equipo de calidad en el seguimiento de procesos de trazabilidad "
                       "agroindustrial, toma de muestras y documentación de resultados en planta.",
        "requirements": ["Técnico o estudiante de Ingeniería Agroindustrial",
                         "Disponibilidad para trabajo en planta"],
        "skills": ["Control de calidad", "Trazabilidad", "Documentación"], "status": VacancyStatus.APROBADA}),
    ("demo.agrotech@practiya.co", {
        "title": "Practicante de Marketing Digital", "city": "Barranquilla", "modality": "REMOTA",
        "stage": "PRODUCTIVA", "openings": 1, "stipend": "100% de un SMLV",
        "description": "Trabajarás con el equipo de marketing en la planeación de campañas digitales, "
                       "calendarios de contenido y análisis de métricas en redes sociales.",
        "requirements": ["Estudiante de Mercadeo, Comunicación o afines", "Buena redacción"],
        "skills": ["Redes sociales", "Analítica", "Redacción"], "status": VacancyStatus.PENDIENTE}),
    ("demo.andina@practiya.co", {
        "title": "Practicante de Logística", "city": "Cali", "modality": "PRESENCIAL",
        "stage": "LECTIVA", "openings": 3, "stipend": "50% de un SMLV",
        "description": "Apoyarás la planeación de rutas de despacho y el control de inventarios del centro "
                       "de distribución regional.",
        "requirements": ["Técnico o tecnólogo en Logística, Producción o afines", "Manejo de Excel"],
        "skills": ["Excel", "Kanban", "Control de inventarios"], "status": VacancyStatus.PENDIENTE}),
]

ESTUDIANTES = [
    {"email": "demo.mariacamila@practiya.co", "name": "María Camila Ruiz", "program": "Ingeniería Industrial",
     "institution": "Universidad Nacional de Colombia", "semester": 8, "city": "Bogotá",
     "about": "Estudiante interesada en análisis de datos y mejora de procesos. Busco un contrato de "
              "aprendizaje en etapa productiva para aplicar lo aprendido en clase.",
     "skills": ["SQL", "Excel", "Power BI", "Python", "Trabajo en equipo", "Comunicación"],
     "applications": [("Practicante de Análisis de Datos", "ENTREVISTA"),
                      ("Practicante de Diseño UX/UI", "EN_REVISION"),
                      ("Practicante Agroindustrial", "ACEPTADO")]},
    {"email": "demo.julian@practiya.co", "name": "Julián Esteban Cortés", "program": "Estadística",
     "institution": "Universidad del Valle", "semester": 9, "city": "Cali",
     "about": "Me apasiona la estadística aplicada.", "skills": ["R", "SQL", "Excel"],
     "applications": [("Practicante de Análisis de Datos", "EN_REVISION")]},
    {"email": "demo.laura@practiya.co", "name": "Laura Valentina Gómez", "program": "Tecnólogo en Análisis y "
     "Desarrollo de Software", "institution": "SENA", "semester": 4, "city": "Medellín",
     "about": "Aprendiz SENA en busca de etapa productiva.", "skills": ["Python", "Git", "Django"],
     "applications": [("Practicante de Análisis de Datos", "APLICADO"),
                      ("Practicante de Backend Jr.", "APLICADO")]},
]


def pdf_demo(nombre):
    """Un PDF minimo y valido con el nombre del estudiante."""
    texto = f"Hoja de vida de {nombre} - datos de demostracion PractiYA"
    texto = texto.encode("latin-1", "replace").decode("latin-1").replace("(", "").replace(")", "")
    stream = f"BT /F1 14 Tf 60 760 Td ({texto}) Tj ET"
    objetos = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
        "/Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out, offsets = "%PDF-1.4\n", []
    for i, obj in enumerate(objetos, start=1):
        offsets.append(len(out.encode("latin-1")))
        out += f"{i} 0 obj\n{obj}\nendobj\n"
    xref = len(out.encode("latin-1"))
    out += f"xref\n0 {len(objetos) + 1}\n0000000000 65535 f \n"
    out += "".join(f"{o:010d} 00000 n \n" for o in offsets)
    out += f"trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n"
    return out.encode("latin-1")


class Command(BaseCommand):
    help = "Carga empresas, vacantes, estudiantes y postulaciones de demostracion."

    def usuario(self, email, role, nombre):
        user = User.objects.filter(email=email).first()
        if user:
            return user, False
        user = User.objects.create_user(
            username=email.split("@")[0], email=email, password=PASSWORD, role=role,
            first_name=nombre, terms_accepted=True,
        )
        crear_perfil(user)
        return user, True

    @transaction.atomic
    def handle(self, *args, **options):
        admin = User.objects.filter(role=Role.ADMIN).first()
        ahora = timezone.now()

        for datos in EMPRESAS:
            datos = dict(datos)
            user, nuevo = self.usuario(datos.pop("email"), Role.EMPRESA, datos["legal_name"])
            if nuevo:
                perfil = user.company_profile
                for campo, valor in datos.items():
                    setattr(perfil, campo, valor)
                if perfil.status == ReviewStatus.APROBADA:
                    perfil.reviewed_at, perfil.reviewed_by = ahora, admin
                perfil.save()
                self.stdout.write(f"  Empresa: {perfil.legal_name} ({perfil.get_status_display()})")

        for email, datos in VACANTES:
            company = User.objects.get(email=email).company_profile
            if company.vacancies.filter(title=datos["title"]).exists():
                continue
            vacancy = Vacancy(company=company, **datos)
            if vacancy.status != VacancyStatus.BORRADOR:
                vacancy.submitted_at = ahora
            if vacancy.status in (VacancyStatus.APROBADA, VacancyStatus.PAUSADA):
                vacancy.reviewed_at, vacancy.reviewed_by = ahora, admin
            vacancy.save()
            self.stdout.write(f"  Vacante: {vacancy.title} ({vacancy.get_status_display()})")

        for datos in ESTUDIANTES:
            datos = dict(datos)
            postulaciones = datos.pop("applications")
            user, nuevo = self.usuario(datos.pop("email"), Role.ESTUDIANTE, datos.pop("name"))
            perfil = user.student_profile
            if nuevo:
                for campo, valor in datos.items():
                    setattr(perfil, campo, valor)
                nombre_pdf = f"CV_{user.first_name.replace(' ', '')}.pdf"
                perfil.cv_filename, perfil.cv_uploaded_at = nombre_pdf, ahora
                contenido = pdf_demo(user.first_name)
                perfil.cv_size = len(contenido)
                perfil.cv.save(nombre_pdf, ContentFile(contenido), save=False)
                perfil.save()
                self.stdout.write(f"  Estudiante: {user.first_name}")
            for titulo, estado in postulaciones:
                vacancy = Vacancy.objects.filter(title=titulo).first()
                if vacancy:
                    Application.objects.get_or_create(
                        student=perfil, vacancy=vacancy, defaults={"status": estado}
                    )

        self.stdout.write(self.style.SUCCESS(
            f"\nDatos de demostracion listos. Contrasena de todas las cuentas demo: {PASSWORD}\n"
            "  Estudiante: demo.mariacamila@practiya.co\n"
            "  Empresa:    demo.technova@practiya.co"
        ))
