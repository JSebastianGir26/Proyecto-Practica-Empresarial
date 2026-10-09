from rest_framework import serializers

from apps.companies.models import CompanyProfile
from apps.jobs.models import Vacancy
from apps.students.serializers import file_url


class CompanyReviewSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="display_name")
    email = serializers.EmailField(source="user.email")
    contact_name = serializers.CharField(source="user.first_name")
    initials = serializers.CharField()
    logo_url = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display")
    vacancies_count = serializers.IntegerField(default=0)

    class Meta:
        model = CompanyProfile
        fields = [
            "id", "name", "email", "contact_name", "initials", "logo_url", "nit", "city",
            "website", "about", "sectors", "status", "status_display", "rejection_reason",
            "created_at", "reviewed_at", "vacancies_count",
        ]

    def get_logo_url(self, obj):
        return file_url(self.context.get("request"), obj.logo)


class VacancyReviewSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.display_name")
    company_status = serializers.CharField(source="company.status")
    company_status_display = serializers.CharField(source="company.get_status_display")
    modality_display = serializers.CharField(source="get_modality_display")
    stage_display = serializers.CharField(source="get_stage_display")
    status_display = serializers.CharField(source="get_status_display")

    class Meta:
        model = Vacancy
        fields = [
            "id", "title", "company", "company_name", "company_status", "company_status_display",
            "city", "openings", "modality_display", "stage_display", "duration_months",
            "stipend", "description", "requirements", "skills", "status", "status_display",
            "rejection_reason", "submitted_at", "reviewed_at",
        ]


class RejectSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
