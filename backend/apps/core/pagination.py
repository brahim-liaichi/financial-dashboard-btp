from rest_framework.pagination import PageNumberPagination


class FlexiblePageNumberPagination(PageNumberPagination):
    page_size = 25  # default if not specified
    page_size_query_param = "page_size"
    max_page_size = 100
