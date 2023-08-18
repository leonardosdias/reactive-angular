import { BehaviorSubject, Observable, throwError } from "rxjs";
import { Course, sortCoursesBySeqNo } from "../model/course";
import { catchError, map, shareReplay, tap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { LoadingService } from "../loading/loading.service";
import { MessagesService } from "../messages/message.service";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class CoursesStore {
    private subject = new BehaviorSubject<Course[]>([]);

    courses$: Observable<Course[]> = this.subject.asObservable();

    constructor(
        private http: HttpClient,
        private loading: LoadingService,
        private messages: MessagesService
    ) {
        this.loadlAllCourses();
    }

    private loadlAllCourses() {
        const loadCourses$ = this.http.get<Course[]>('/api/courses')
            .pipe(
                map(response => response['payload']),
                catchError(err => {
                    const message = 'Erro';
                    this.messages.showErrors(message);
                    return throwError(err);
                }),
                tap(courses => {
                    this.subject.next(courses)
                })
            );

        this.loading.showLoaderUntilCompleted(loadCourses$)
            .subscribe();
    }

    saveCourse(courseId: string, changes: Partial<Course>): Observable<any> {
        const courses = this.subject.getValue();

        const index = courses.findIndex(course => course.id === courseId);

        const newCourse: Course = {
            ...courses[index],
            ...changes
        };

        const newsCourses: Course[] = courses.slice(0);
        newsCourses[index] = newCourse;

        this.subject.next(newsCourses);

        return this.http.put(`/api/courses/${courseId}`, changes)
            .pipe(
                catchError(err => {
                    const message = 'Erro ao salvar o curso, tente novamente.';
                    console.log(message, err);
                    this.messages.showErrors(message);
                    return throwError(err);
                }),
                shareReplay()
            );
    }

    filterByCategory(category: string): Observable<Course[]> {
        return this.courses$
            .pipe(
                map(courses =>
                    courses.filter(course => course.category === category)
                        .sort(sortCoursesBySeqNo)
                )
            )
    }
}