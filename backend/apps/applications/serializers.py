from rest_framework import serializers

from apps.companies.serializers import CompanyPublicSerializer
from apps.students.serializers import StudentSummarySerializer

from .models import Application, ApplicationStatus


class StudentApplicationSerializer(serializers.ModelSerializer):
    """HU-10 · Lo que ve el estudiante en "Mis postulaciones"."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    vacancy = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = ["id", "vacancy", "status", "status_display", "created_at", "status_changed_at"]

    def get_vacancy(self, obj):
        v = obj.vacancy
        return {
            "id": v.id,
            "title": v.title,
            "city": v.city,
            "modality_display": v.get_modality_display(),
            "company": CompanyPublicSerializer(v.company, context=self.context).data,
        }


class ApplyCreateSerializer(serializers.Serializer):
    """HU-08 · POST /api/postulaciones/ {"vacancy": <id>}"""

    vacancy = serializers.IntegerField()


class CompanyApplicationSerializer(serializers.ModelSerializer):
    """HU-16 · Lo que ve la empresa en la lista de postulantes."""

    student = StudentSummarySerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    vacancy_title = serializers.CharField(source="vacancy.title", read_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "student", "vacancy", "vacancy_title", "status", "status_display",
            "created_at", "status_changed_at",
        ]


class StatusChangeSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ApplicationStatus.choices)
