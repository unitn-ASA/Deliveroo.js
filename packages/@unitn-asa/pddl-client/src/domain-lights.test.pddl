;; domain file: domain-lights.pddl
(define (domain lights)
    (:requirements :strips)
    (:predicates
        (switched-on ?l)
		(switched-off ?l)
		(switched-off ?l)
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