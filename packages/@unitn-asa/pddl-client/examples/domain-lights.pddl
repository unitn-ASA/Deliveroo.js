;; domain file: domain-lights.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (switched-on ?l)
		(switched-off ?l)            
    )
    
    (:action LightOn
        :parameters (?l)
        :precondition (and (switched-off ?l) )
        :effect (and
            (switched-on ?l)
			(not (switched-off ?l))
        )
    )
)