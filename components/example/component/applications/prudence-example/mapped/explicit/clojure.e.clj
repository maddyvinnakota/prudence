; Use the JSON libraries and our context library
(use
	'clojure.data.json
	'data.clojure)

(import
	'java.io.File)

; State
;
; These make sure that our state is properly stored in the context,
; so that we always use the same state, even if this script is recompiled.

(defn get-state []
	;
	; Important! Clojure maps are not regular old Java maps. They are *persistent*, meaning that on the
	; the one hand they are immutable, and on the other hand they maintain performance behavior when
	; extended into new forms. Bottom line for us here is that we do not need to do any locking to read
	; or "modify" our state. In other flavors of Prudence, you will find it more difficult (and error-
	; prone) to deal with state. Viva Clojure!
	;

	(get-global application "clojure.state"
		#(identity {"name" "Coraline", "media" "Film", "rating" "A+", "characters" ["Coraline" "Wybie" "Mom" "Dad"]})))

(defn set-state [value]
  (.. application getGlobals (put "clojure.state" value)))

(defn handle-init [conversation]
  (.. conversation (addMediaTypeByName "text/plain"))
  (.. conversation (addMediaTypeByName "application/json")))

(defn handle-get [conversation]
  (let
    [state (get-state)]
    (json-str state)))

(defn handle-post [conversation]
  (let
    [update (read-json (.. conversation getEntity getText))
     state (get-state)]
    (set-state (merge state update)))
  (handle-get conversation))

(defn handle-put [conversation]
  (let
    [update (read-json (.. conversation getEntity getText))]
    (set-state update))
	(handle-get conversation))

(defn handle-delete [conversation]
	(set-state {})
	nil)
