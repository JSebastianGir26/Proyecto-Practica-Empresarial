from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEstudiante

from .models import StudentProfile
from .serializers import CVUploadSerializer, StudentProfileSerializer


def perfil_de(user):
    return StudentProfile.objects.select_related("user").get_or_create(user=user)[0]


class MyProfileView(generics.RetrieveUpdateAPIView):
    """HU-04 · Editar mi perfil — GET/PATCH /api/estudiantes/perfil/"""

    serializer_class = StudentProfileSerializer
    permission_classes = [IsEstudiante]
    http_method_names = ["get", "patch", "options"]

    def get_object(self):
        return perfil_de(self.request.user)


class MyCVView(APIView):
    """
    HU-05 · Subir hoja de vida
    PUT    /api/estudiantes/perfil/hoja-de-vida/  (multipart, campo `cv`) sube o reemplaza
    DELETE /api/estudiantes/perfil/hoja-de-vida/  la elimina
    """

    permission_classes = [IsEstudiante]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        profile = perfil_de(request.user)
        serializer = CVUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile)
        return Response(StudentProfileSerializer(profile, context={"request": request}).data)

    def delete(self, request):
        profile = perfil_de(request.user)
        if profile.cv:
            profile.cv.delete(save=False)
        profile.cv_filename = ""
        profile.cv_size = None
        profile.cv_uploaded_at = None
        profile.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
